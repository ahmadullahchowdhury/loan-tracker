import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import connectDB from './mongoose';
import User from './models/User';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters. Set a strong random value in .env.local.');
}

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function setAuthCookie(response, token) {
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  });
}

export function clearAuthCookie(response) {
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
}

export async function verifyAuth(request) {
  // Tokens are stored in HttpOnly cookies, not Authorization headers
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return { error: NextResponse.json({ message: 'Not authenticated' }, { status: 401 }) };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await connectDB();
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return { error: NextResponse.json({ message: 'User not found' }, { status: 401 }) };
    }

    // Reject tokens that were issued before the user's last logout
    if (user.lastLogout && decoded.iat * 1000 < user.lastLogout.getTime()) {
      return { error: NextResponse.json({ message: 'Session expired, please log in again' }, { status: 401 }) };
    }

    return { user };
  } catch {
    return { error: NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 }) };
  }
}
