const express = require('express');
const Loan = require('../models/Loan');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/summary/overview
// @desc    Get loan overview for authenticated user
// @access  Private
router.get('/overview', auth, async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user._id });

    const summary = {
      totalLent: 0,
      totalTaken: 0,
      netAmount: 0,
      totalLoans: loans.length,
      activeLentLoans: 0,
      activeTakenLoans: 0
    };

    loans.forEach(loan => {
      if (loan.type === 'given') {
        summary.totalLent += loan.currentBalance;
        if (loan.currentBalance > 0) {
          summary.activeLentLoans++;
        }
      } else if (loan.type === 'taken') {
        summary.totalTaken += loan.currentBalance;
        if (loan.currentBalance > 0) {
          summary.activeTakenLoans++;
        }
      }
    });

    summary.netAmount = summary.totalLent - summary.totalTaken;

    res.json(summary);
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

