import { useState } from "react";
import { useExpenses } from "../context/ExpenseContext";

const CATEGORIES = [
  "General",
  "Food & Dining",
  "Transportation",
  "Education",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Healthcare",
];

function AddExpense() {
  const { addExpense } = useExpenses();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Please enter an expense name.");
      return;
    }

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid amount greater than ₹0.");
      return;
    }

    setIsSubmitting(true);

    const newExpense = {
      title: title.trim(),
      amount: numAmount,
      category: category,
      description: description.trim(),
      date: new Date().toISOString(),
    };

    const res = await addExpense(newExpense);
    setIsSubmitting(false);

    if (res && res.error) {
      setFormError(res.error);
    } else {
      setTitle("");
      setAmount("");
      setDescription("");
      setCategory("General");
    }
  };

  return (
    <div className="add-expense-card">
      <div className="card-header">
        <h2>Add New Expense</h2>
        <span className="badge-secure">🛡️ Validated API</span>
      </div>

      {formError && <div className="alert-error">{formError}</div>}

      <form onSubmit={handleSubmit} className="expense-form">
        <div className="form-group">
          <label>Expense Name</label>
          <input
            type="text"
            placeholder="e.g. Grocery, Textbooks, Coffee"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 250"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              className="category-select"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Description (Optional)</label>
          <input
            type="text"
            placeholder="Optional note"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Securing & Adding..." : "+ Add Expense"}
        </button>
      </form>
    </div>
  );
}

export default AddExpense;
