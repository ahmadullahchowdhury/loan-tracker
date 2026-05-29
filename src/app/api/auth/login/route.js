import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import User from '@/lib/models/User';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { checkRateLimit, getRateLimitKey } from '@/lib/rateLimit';

export async function POST(request) {
  // 5 attempts per 15 minutes per IP
  const { allowed, retryAfter } = checkRateLimit(`login:${getRateLimitKey(request)}`);
  if (!allowed) {
    return NextResponse.json(
      { message: `Too many login attempts. Try again in ${retryAfter} seconds.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Please provide email and password' }, { status: 400 });
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ message: 'Invalid input' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = generateToken(user._id);
    const response = NextResponse.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email },
    });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Server error during login' }, { status: 500 });
  }
}
