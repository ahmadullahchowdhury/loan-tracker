import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import Loan from '@/lib/models/Loan';
import Transaction from '@/lib/models/Transaction';
import { sendLoanSummary } from '@/lib/email';

export async function POST(request, { params }) {
  const { user, error } = await verifyAuth(request);
  if (error) return error;

  try {
    await connectDB();

    const loan = await Loan.findOne({ _id: params.id, userId: user._id });
    if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });

    if (!loan.contactEmail) {
      return NextResponse.json({ error: 'This loan has no contact email set' }, { status: 400 });
    }

    const transactions = await Transaction.find({ loanId: loan._id, userId: user._id })
      .sort({ transactionDate: -1 })
      .lean();

    await sendLoanSummary({
      toEmail: loan.contactEmail,
      toName: loan.personName,
      loan,
      transactions,
    });

    return NextResponse.json({ message: 'Summary sent to ' + loan.contactEmail });
  } catch (err) {
    console.error('Send summary error:', err);
    return NextResponse.json({ error: 'Failed to send summary email' }, { status: 500 });
  }
}
