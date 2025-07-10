const express = require('express');
const Transaction = require('../models/Transaction');
const Loan = require('../models/Loan');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/transactions/loan/:loanId
// @desc    Get all transactions for a specific loan for authenticated user
// @access  Private
router.get('/loan/:loanId', auth, async (req, res) => {
  try {
    // Verify loan belongs to user
    const loan = await Loan.findOne({ _id: req.params.loanId, userId: req.user._id });
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const transactions = await Transaction.find({ 
      loanId: req.params.loanId, 
      userId: req.user._id 
    }).sort({ transactionDate: -1 });
    
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get transaction by ID for authenticated user
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/transactions
// @desc    Create a new transaction for authenticated user
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { loanId, type, amount, method, notes } = req.body;

    // Validation
    if (!loanId || !type || !amount) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!['given', 'paidBack', 'taken', 'returned'].includes(type)) {
      return res.status(400).json({ message: 'Invalid transaction type' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Verify loan belongs to user
    const loan = await Loan.findOne({ _id: loanId, userId: req.user._id });
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Create transaction
    const transaction = new Transaction({
      userId: req.user._id,
      loanId,
      type,
      amount,
      method: method || 'Cash',
      notes
    });

    await transaction.save();

    // Update loan balance
    let newBalance = loan.currentBalance;
    
    if (loan.type === 'given') {
      // For money lent
      if (type === 'given') {
        newBalance += amount; // Additional money given
      } else if (type === 'paidBack') {
        newBalance -= amount; // Money paid back to us
      }
    } else if (loan.type === 'taken') {
      // For money borrowed
      if (type === 'taken') {
        newBalance += amount; // Additional money taken
      } else if (type === 'returned') {
        newBalance -= amount; // Money returned by us
      }
    }

    loan.currentBalance = Math.max(0, newBalance);
    await loan.save();

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction for authenticated user
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { amount, method, notes } = req.body;

    const transaction = await Transaction.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const oldAmount = transaction.amount;

    // Update allowed fields
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({ message: 'Amount must be greater than 0' });
      }
      transaction.amount = amount;
    }
    if (method) transaction.method = method;
    if (notes !== undefined) transaction.notes = notes;

    await transaction.save();

    // Update loan balance if amount changed
    if (amount !== undefined && amount !== oldAmount) {
      const loan = await Loan.findOne({ _id: transaction.loanId, userId: req.user._id });
      if (loan) {
        const amountDiff = amount - oldAmount;
        let newBalance = loan.currentBalance;

        if (loan.type === 'given') {
          if (transaction.type === 'given') {
            newBalance += amountDiff;
          } else if (transaction.type === 'paidBack') {
            newBalance -= amountDiff;
          }
        } else if (loan.type === 'taken') {
          if (transaction.type === 'taken') {
            newBalance += amountDiff;
          } else if (transaction.type === 'returned') {
            newBalance -= amountDiff;
          }
        }

        loan.currentBalance = Math.max(0, newBalance);
        await loan.save();
      }
    }

    res.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction for authenticated user
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Update loan balance before deleting transaction
    const loan = await Loan.findOne({ _id: transaction.loanId, userId: req.user._id });
    if (loan) {
      let newBalance = loan.currentBalance;

      if (loan.type === 'given') {
        if (transaction.type === 'given') {
          newBalance -= transaction.amount; // Remove given amount
        } else if (transaction.type === 'paidBack') {
          newBalance += transaction.amount; // Remove paid back amount
        }
      } else if (loan.type === 'taken') {
        if (transaction.type === 'taken') {
          newBalance -= transaction.amount; // Remove taken amount
        } else if (transaction.type === 'returned') {
          newBalance += transaction.amount; // Remove returned amount
        }
      }

      loan.currentBalance = Math.max(0, newBalance);
      await loan.save();
    }

    await Transaction.findByIdAndDelete(req.params.id);

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

