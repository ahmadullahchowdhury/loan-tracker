import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { sendTransactionNotification } from '@/lib/email';

// GET /api/test-email?to=someone@example.com
// Only works while logged in. Remove this file before going to production.
export async function GET(request) {
  const { user, error } = await verifyAuth(request);
  if (error) return error;

  const to = request.nextUrl.searchParams.get('to');
  if (!to) {
    return NextResponse.json({ message: 'Pass ?to=email in the URL' }, { status: 400 });
  }

  try {
    await sendTransactionNotification({
      toEmail: to,
      toName: 'Test Person',
      fromName: user.name,
      type: 'paidBack',
      amount: 1000,
      currency: 'BDT',
      notes: 'This is a test notification',
      date: new Date(),
    });
    return NextResponse.json({ message: `Test email sent to ${to}` });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
