import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import Loan from '@/lib/models/Loan';

export async function GET(request) {
  const { user, error } = await verifyAuth(request);
  if (error) return error;

  // Single aggregation fetches loans + last transaction for each in one round-trip
  const loans = await Loan.aggregate([
    { $match: { userId: user._id } },
    {
      $lookup: {
        from: 'transactions',
        let: { loanId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$loanId', '$$loanId'] } } },
          { $sort: { transactionDate: -1 } },
          { $limit: 1 },
          { $project: { type: 1, amount: 1, transactionDate: 1, method: 1 } },
        ],
        as: 'lastTransaction',
      },
    },
    { $addFields: { lastTransaction: { $arrayElemAt: ['$lastTransaction', 0] } } },
    { $sort: { createdAt: -1 } },
    { $limit: 100 },
  ]);

  return NextResponse.json(loans);
}

export async function POST(request) {
  const { user, error } = await verifyAuth(request);
  if (error) return error;

  try {
    const { personName, type, currency, notes, contactEmail } = await request.json();

    if (!personName || !type) {
      return NextResponse.json({ message: 'Please provide person name and loan type' }, { status: 400 });
    }
    if (typeof personName !== 'string' || personName.trim().length === 0 || personName.trim().length > 100) {
      return NextResponse.json({ message: 'Person name must be between 1 and 100 characters' }, { status: 400 });
    }
    if (!['given', 'taken'].includes(type)) {
      return NextResponse.json({ message: 'Invalid loan type' }, { status: 400 });
    }
    if (notes !== undefined && typeof notes === 'string' && notes.length > 500) {
      return NextResponse.json({ message: 'Notes cannot exceed 500 characters' }, { status: 400 });
    }

    const loan = await Loan.create({
      userId: user._id,
      personName: personName.trim(),
      type,
      initialAmount: 0,
      currentBalance: 0,
      currency: currency || 'BDT',
      notes: notes?.trim() || '',
      contactEmail: contactEmail?.trim().toLowerCase() || '',
    });

    return NextResponse.json(loan, { status: 201 });
  } catch (err) {
    console.error('Create loan error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
