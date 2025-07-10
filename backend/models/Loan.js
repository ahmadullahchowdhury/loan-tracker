const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personName: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['given', 'taken'],
    required: true
  },
  initialAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentBalance: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'BDT',
    enum: ['BDT', 'USD', 'EUR']
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better query performance
loanSchema.index({ userId: 1, personName: 1, type: 1 });

module.exports = mongoose.model('Loan', loanSchema);

