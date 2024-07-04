const asyncHandler = require('express-async-handler');
const { Expense } = require('../models/expenseModel');
const capitalizeAndClean = require('../utils/stringUtils');

// Create expense
const createExpense = asyncHandler(async (req, res, next) => {
  try {
  let { type, amount, description } = req.body;

  type = capitalizeAndClean(type);

  console.log("ok expense");
  if (!type || !amount) {
    res.status(400);
    throw new Error('Please fill all fields');
  }
  const expense = await Expense.create({ 
    type, 
    amount, 
    description });
  res.status(201).json(expense);
  }
  catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// Update expense
const updateExpense = asyncHandler(async (req, res, next) => {
  try {
  const { id } = req.params;
  let { type, amount, description } = req.body;

  type = capitalizeAndClean(type);
  console.log("ok expense");


  if (!type || !amount) {
    res.status(400);
    throw new Error('Please fill all fields');
  }

  const expense = await Expense.findByIdAndUpdate(
    id, 
    { type, amount }, 
    { new: true });

  if (!expense) {
    return res.status(404).json('Expense not found');
  }
  res.status(200).json(expense);
  }
  catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// Get all expenses
const getAllExpenses = asyncHandler(async (req, res, next) => {
  const expenses = await Expense.find();
  console.log("ok expense");

  res.status(200).json(expenses );
});

// Get expense by ID
const getExpenseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const expense = await Expense.findById(id);
  console.log("ok expense");
  if (!expense) {
    return res.status(404).json('Expense not found');
  }
  res.status(200).json(expense);
});

// Delete expense
const deleteExpense = asyncHandler(async (req, res, next) => {
  try {
  const { id } = req.params;
  const expense = await Expense.findByIdAndDelete(id);
  if (!expense) {
    return res.status(404).json('Expense not found');
  }
  res.status(200).json('Expense deleted successfully');
  }
  catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = {
  createExpense,
  updateExpense,
  getAllExpenses,
  getExpenseById,
  deleteExpense
};
