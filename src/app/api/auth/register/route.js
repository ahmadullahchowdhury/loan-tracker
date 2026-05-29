import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import User from '@/lib/models/User';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { checkRateLimit, getRateLimitKey } from '@/lib/rateLimit';

export async function POST(request) {
  // 3 registrations per hour per IP
  const { allowed, retryAfter } = checkRateLimit(`register:${getRateLimitKey(request)}`, 3, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { message: `Too many registration attempts. Try again in ${retryAfter} seconds.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Please provide all required fields' }, { status: 400 });
    }
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
    }
    if (name.trim().length < 2 || name.trim().length > 50) {
      return NextResponse.json({ message: 'Name must be between 2 and 50 characters' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters long' }, { status: 400 });
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { message: 'Password must contain at least one letter and one number' },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ message: 'User already exists with this email' }, { status: 400 });
    }

    const user = new User({ name: name.trim(), email: email.toLowerCase().trim(), password });
    await user.save();

    const token = generateToken(user._id);
    const response = NextResponse.json(
      { message: 'User registered successfully', user: { id: user._id, name: user.name, email: user.email } },
      { status: 201 }
    );
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Server error during registration' }, { status: 500 });
  }
}
