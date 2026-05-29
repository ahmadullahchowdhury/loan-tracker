import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import Loan from '@/lib/models/Loan';
import Transaction from '@/lib/models/Transaction';

export async function GET(request, { params }) {
  const { user, error } = await verifyAuth(request);
  if (error) return error;

  const { loanId } = await params; // Next.js 15: params is async

  const loan = await Loan.findOne({ _id: loanId, userId: user._id });
  if (!loan) return NextResponse.json({ message: 'Loan not found' }, { status: 404 });

  // Cap at 200 to prevent unbounded response size
  const transactions = await Transaction.find({ loanId, userId: user._id })
    .sort({ transactionDate: -1 })
    .limit(200);

  return NextResponse.json(transactions);
}
