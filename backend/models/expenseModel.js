const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String
  }},
  {
    timestamps: {
      currentTime: () => new Date().getTime() + (3 * 60 * 60 * 1000) // Adjust for GMT+3 (3 hours ahead of UTC)
    }
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = {
  Expense
};
