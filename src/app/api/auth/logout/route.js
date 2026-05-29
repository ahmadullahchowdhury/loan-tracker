import { NextResponse } from 'next/server';
import { verifyAuth, clearAuthCookie } from '@/lib/auth';
import User from '@/lib/models/User';

export async function POST(request) {
  const { user } = await verifyAuth(request);

  // Record logout time so this token is rejected on future requests
  if (user) {
    await User.findByIdAndUpdate(user._id, { lastLogout: new Date() });
  }

  const response = NextResponse.json({ message: 'Logged out successfully' });
  clearAuthCookie(response);
  return response;
}
