import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import Loan from '@/lib/models/Loan';

export async function GET(request) {
  const { user, error } = await verifyAuth(request);
  if (error) return error;

  // verifyAuth already connected the DB
  const loans = await Loan.find({ userId: user._id });

  const summary = {
    totalLent: 0,
    totalTaken: 0,
    netAmount: 0,
    totalLoans: loans.length,
    activeLentLoans: 0,
    activeTakenLoans: 0,
  };

  for (const loan of loans) {
    if (loan.type === 'given') {
      summary.totalLent += loan.currentBalance;
      if (loan.currentBalance > 0) summary.activeLentLoans++;
    } else if (loan.type === 'taken') {
      summary.totalTaken += loan.currentBalance;
      if (loan.currentBalance > 0) summary.activeTakenLoans++;
    }
  }

  summary.netAmount = summary.totalLent - summary.totalTaken;
  return NextResponse.json(summary);
}
