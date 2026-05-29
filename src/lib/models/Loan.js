import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    personName: { type: String, required: true, trim: true },
    type: { type: String, enum: ['given', 'taken'], required: true },
    initialAmount: { type: Number, default: 0, min: 0 },
    currentBalance: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'BDT', enum: ['BDT', 'USD', 'EUR'] },
    notes: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true, default: '' },
  },
  { timestamps: true }
);

loanSchema.index({ userId: 1, personName: 1, type: 1 });

// Delete cached model in dev so schema changes (e.g. new fields) take effect
// without requiring a full server restart.
if (process.env.NODE_ENV === 'development' && mongoose.models.Loan) {
  delete mongoose.models.Loan;
}
const Loan = mongoose.model('Loan', loanSchema);
export default Loan;
