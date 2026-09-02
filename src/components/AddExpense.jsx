import { useState } from "react";
import { useExpenses } from "../context/ExpenseContext";

function AddExpense() {
  const { addExpense } = useExpenses();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title || !amount) {
      return;
    }

    const newExpense = {
      id: Date.now(),
      title: title,
      amount: Number(amount),
    };

    addExpense(newExpense);

    setTitle("");
    setAmount("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Expense</h2>

      <input
        type="text"
        placeholder="Expense name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button type="submit">Add Expense</button>
    </form>
  );
}

export default AddExpense;