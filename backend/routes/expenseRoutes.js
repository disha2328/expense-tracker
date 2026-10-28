const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const {
  validateExpenseCreate,
  validateExpenseUpdate,
  validateExpenseId,
} = require("../middleware/validator");

/**
 * @route   GET /api/expenses
 * @desc    Get all expenses (sorted by newest date first)
 * @access  Public
 */
router.get("/", async (req, res, next) => {
  try {
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/expenses/:id
 * @desc    Get single expense by MongoDB ID
 * @access  Public (Validated)
 */
router.get("/:id", validateExpenseId, async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/expenses
 * @desc    Create a new expense (Input Validated, NoSQL Injection Protected)
 * @access  Public (Validated)
 */
router.post("/", validateExpenseCreate, async (req, res, next) => {
  try {
    // Explicit field destructuring prevents parameter injection
    const { title, amount, category, date, description } = req.body;

    const newExpense = new Expense({
      title,
      amount,
      category: category || "General",
      date: date || new Date(),
      description: description || "",
    });

    const savedExpense = await newExpense.save();

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: savedExpense,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/expenses/:id
 * @desc    Update an existing expense by ID
 * @access  Public (Validated)
 */
router.put("/:id", validateExpenseUpdate, async (req, res, next) => {
  try {
    const { title, amount, category, date, description } = req.body;

    // Build update object only from allowed fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (amount !== undefined) updateData.amount = amount;
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) updateData.date = date;
    if (description !== undefined) updateData.description = description;

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete an expense by ID
 * @access  Public (Validated)
 */
router.delete("/:id", validateExpenseId, async (req, res, next) => {
  try {
    const deletedExpense = await Expense.findByIdAndDelete(req.params.id);

    if (!deletedExpense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
