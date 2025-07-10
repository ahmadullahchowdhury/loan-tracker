const express = require('express');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/loans
// @desc    Get all loans for authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(loans);
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/loans/:id
// @desc    Get loan by ID for authenticated user
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    
    res.json(loan);
  } catch (error) {
    console.error('Get loan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/loans
// @desc    Create a new loan for authenticated user
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { personName, type, initialAmount, currency, notes, method } = req.body;

    // Validation
    if (!personName || !type || !initialAmount) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!['given', 'taken'].includes(type)) {
      return res.status(400).json({ message: 'Invalid loan type' });
    }

    if (initialAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Create loan
    const loan = new Loan({
      userId: req.user._id,
      personName,
      type,
      initialAmount,
      currentBalance: initialAmount,
      currency: currency || 'BDT',
      notes
    });

    await loan.save();

    // Create initial transaction
    const transactionType = type === 'given' ? 'given' : 'taken';
    const transaction = new Transaction({
      userId: req.user._id,
      loanId: loan._id,
      type: transactionType,
      amount: initialAmount,
      method: method || 'Cash',
      notes: notes || `Initial loan ${type}`
    });

    await transaction.save();

    res.status(201).json(loan);
  } catch (error) {
    console.error('Create loan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/loans/:id
// @desc    Update loan for authenticated user
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { personName, notes, currency } = req.body;

    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Update allowed fields
    if (personName) loan.personName = personName;
    if (notes !== undefined) loan.notes = notes;
    if (currency) loan.currency = currency;

    await loan.save();
    res.json(loan);
  } catch (error) {
    console.error('Update loan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/loans/:id
// @desc    Delete loan and all related transactions for authenticated user
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Delete all related transactions
    await Transaction.deleteMany({ loanId: req.params.id, userId: req.user._id });
    
    // Delete the loan
    await Loan.findByIdAndDelete(req.params.id);

    res.json({ message: 'Loan and related transactions deleted successfully' });
  } catch (error) {
    console.error('Delete loan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

