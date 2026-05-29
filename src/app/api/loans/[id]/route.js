import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import Loan from '@/lib/models/Loan';
import Transaction from '@/lib/models/Transaction';

export async function GET(request, { params }) {
  const { user, error } = await verifyAuth(request);
  if (error) return error;

  const { id } = await params;
  const raw = await Loan.findOne({ _id: id, userId: user._id }).lean();
  if (!raw) return NextResponse.json({ message: 'Loan not found' }, { status: 404 });
  return NextResponse.json(raw);
}

export async function PUT(request, { params }) {
  const { user, error } = await verifyAuth(request);
  if (error) return error;

  try {
    const { personName, notes, currency, contactEmail } = await request.json();
    const { id } = await params;

    if (personName !== undefined) {
      if (typeof personName !== 'string' || personName.trim().length === 0 || personName.trim().length > 100) {
        return NextResponse.json({ message: 'Person name must be between 1 and 100 characters' }, { status: 400 });
      }
    }
    if (notes !== undefined && typeof notes === 'string' && notes.length > 500) {
      return NextResponse.json({ message: 'Notes cannot exceed 500 characters' }, { status: 400 });
    }

    // Build only the fields that were actually sent
    const fields = {};
    if (personName) fields.personName = personName.trim();
    if (notes !== undefined) fields.notes = notes.trim();
    if (currency) fields.currency = currency;
    if (contactEmail !== undefined) fields.contactEmail = contactEmail.trim().toLowerCase();

    // findOneAndUpdate with $set writes directly to MongoDB — no Mongoose
    // document mutation, no stale-path issues, guaranteed to persist every field.
    const updated = await Loan.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set: fields },
      { new: true, lean: true, strict: false }
    );

    if (!updated) return NextResponse.json({ message: 'Loan not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('Update loan error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { user, error } = await verifyAuth(request);
  if (error) return error;

  const { id } = await params;
  const loan = await Loan.findOne({ _id: id, userId: user._id });
  if (!loan) return NextResponse.json({ message: 'Loan not found' }, { status: 404 });

  await Transaction.deleteMany({ loanId: id, userId: user._id });
  await Loan.findByIdAndDelete(id);

  return NextResponse.json({ message: 'Loan and related transactions deleted successfully' });
}
