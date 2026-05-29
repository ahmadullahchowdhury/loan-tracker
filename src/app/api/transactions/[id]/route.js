import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import Loan from '@/lib/models/Loan';
import Transaction from '@/lib/models/Transaction';

function signedDelta(loanType, transactionType, amount) {
  if (loanType === 'given') {
    if (transactionType === 'given') return +amount;
    if (transactionType === 'paidBack') return -amount;
  } else if (loanType === 'taken') {
    if (transactionType === 'taken') return +amount;
    if (transactionType === 'returned') return -amount;
  }
  return 0;
}

export async function GET(request, { params }) {
  const { user, error } = await verifyAuth(request);
  if (error) return error;

  const { id } = await params;
  const transaction = await Transaction.findOne({ _id: id, userId: user._id });
  if (!transaction) return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
  return NextResponse.json(transaction);
}

export async function PUT(request, { params }) {
  const { user, error } = await verifyAuth(request);
  if (error) return error;

  try {
    const { amount, method, notes } = await request.json();
    const { id } = await params;

    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0 || amount > 1_000_000_000) {
        return NextResponse.json({ message: 'Amount must be a positive number up to 1,000,000,000' }, { status: 400 });
      }
    }
    if (notes !== undefined && typeof notes === 'string' && notes.length > 500) {
      return NextResponse.json({ message: 'Notes cannot exceed 500 characters' }, { status: 400 });
    }

    const transaction = await Transaction.findOne({ _id: id, userId: user._id });
    if (!transaction) return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });

    const oldAmount = transaction.amount;
    if (amount !== undefined) transaction.amount = amount;
    if (method) transaction.method = method;
    if (notes !== undefined) transaction.notes = notes.trim();
    await transaction.save();

    if (amount !== undefined && amount !== oldAmount) {
      const loan = await Loan.findOne({ _id: transaction.loanId, userId: user._id });
      if (loan) {
        // Net delta: undo old amount effect, apply new amount effect
        const oldEffect = signedDelta(loan.type, transaction.type, oldAmount);
        const newEffect = signedDelta(loan.type, transaction.type, amount);
        const netDelta = newEffect - oldEffect;

        if (netDelta !== 0) {
          // Use aggregation pipeline update to floor at 0 atomically
          await Loan.findOneAndUpdate(
            { _id: transaction.loanId, userId: user._id },
            [{ $set: { currentBalance: { $max: [{ $add: ['$currentBalance', netDelta] }, 0] } } }]
          );
        }
      }
    }

    return NextResponse.json(transaction);
  } catch (err) {
    console.error('Update transaction error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { user, error } = await verifyAuth(request);
  if (error) return error;

  const { id } = await params;
  const transaction = await Transaction.findOne({ _id: id, userId: user._id });
  if (!transaction) return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });

  const loan = await Loan.findOne({ _id: transaction.loanId, userId: user._id });
  if (loan) {
    // Reverse the effect this transaction had on the balance
    const reverseDelta = -signedDelta(loan.type, transaction.type, transaction.amount);
    if (reverseDelta !== 0) {
      await Loan.findOneAndUpdate(
        { _id: transaction.loanId, userId: user._id },
        [{ $set: { currentBalance: { $max: [{ $add: ['$currentBalance', reverseDelta] }, 0] } } }]
      );
    }
  }

  await Transaction.findByIdAndDelete(id);
  return NextResponse.json({ message: 'Transaction deleted successfully' });
}
