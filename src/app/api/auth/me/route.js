import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
  const { user, error } = await verifyAuth(request);
  if (error) return error;

  return NextResponse.json({
    user: { id: user._id, name: user.name, email: user.email },
  });
}
