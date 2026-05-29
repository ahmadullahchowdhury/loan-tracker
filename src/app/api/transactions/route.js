import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import Loan from '@/lib/models/Loan';
import Transaction from '@/lib/models/Transaction';
import { sendTransactionNotification } from '@/lib/email';

// Maps a transaction type to its balance delta sign relative to the loan type.
// Returns 0 when the transaction type is incompatible with the loan type.
function balanceDelta(loanType, transactionType, amount) {
  if (loanType === 'given') {
    if (transactionType === 'given') return +amount;
    if (transactionType === 'paidBack') return -amount;
  } else if (loanType === 'taken') {
    if (transactionType === 'taken') return +amount;
    if (transactionType === 'returned') return -amount;
  }
  return null; // incompatible combination
}

export async function POST(request) {
  const { user, error } = await verifyAuth(request);
  if (error) return error;

  try {
    const { loanId, type, amount, method, notes, transactionDate } = await request.json();

    if (!loanId || !type || !amount) {
      return NextResponse.json({ message: 'Please provide all required fields' }, { status: 400 });
    }
    if (!['given', 'paidBack', 'taken', 'returned'].includes(type)) {
      return NextResponse.json({ message: 'Invalid transaction type' }, { status: 400 });
    }
    if (typeof amount !== 'number' || amount <= 0 || amount > 1_000_000_000) {
      return NextResponse.json({ message: 'Amount must be a positive number up to 1,000,000,000' }, { status: 400 });
    }
    if (notes !== undefined && typeof notes === 'string' && notes.length > 500) {
      return NextResponse.json({ message: 'Notes cannot exceed 500 characters' }, { status: 400 });
    }

    // Verify loan ownership before touching balances
    const loan = await Loan.findOne({ _id: loanId, userId: user._id });
    if (!loan) return NextResponse.json({ message: 'Loan not found' }, { status: 404 });

    const delta = balanceDelta(loan.type, type, amount);
    if (delta === null) {
      return NextResponse.json(
        { message: `Transaction type "${type}" is not valid for a "${loan.type}" loan` },
        { status: 400 }
      );
    }

    const transaction = new Transaction({
      userId: user._id,
      loanId,
      type,
      amount,
      method: method || 'Cash',
      notes: notes?.trim() || '',
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
    });
    await transaction.save();

    // Atomic balance update — prevents race conditions from concurrent requests.
    // If delta is negative, require currentBalance >= |delta| to avoid going below zero.
    const filter = { _id: loanId, userId: user._id };
    if (delta < 0) filter.currentBalance = { $gte: -delta };

    const updatedLoan = await Loan.findOneAndUpdate(filter, { $inc: { currentBalance: delta } }, { new: true });

    if (!updatedLoan) {
      // Rollback the transaction — the loan no longer qualifies (balance would go negative)
      await Transaction.findByIdAndDelete(transaction._id);
      return NextResponse.json({ message: 'Amount exceeds the outstanding balance' }, { status: 400 });
    }

    // Fire-and-forget — email failure must never block the transaction response
    if (loan.contactEmail) {
      console.log('[email] sending to:', loan.contactEmail);
      sendTransactionNotification({
        toEmail: loan.contactEmail,
        toName: loan.personName,
        fromName: user.name,
        type,
        amount,
        currency: loan.currency,
        notes: notes?.trim() || '',
        date: transaction.transactionDate,
        currentBalance: updatedLoan.currentBalance,
        loanType: loan.type,
      }).catch((err) => console.error('[email] notification failed:', err.message));
    } else {
      console.log('[email] skipped — no contactEmail on loan', loanId);
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    console.error('Create transaction error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
