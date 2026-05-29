import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
    type: { type: String, enum: ['given', 'paidBack', 'taken', 'returned'], required: true },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Mobile Banking', 'Check', 'Other'],
      default: 'Cash',
    },
    transactionDate: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, loanId: 1, transactionDate: -1 });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
export default Transaction;
