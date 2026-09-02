import { useEffect, useContext, useState } from "react";
import UserContext from "../UserContext";
import useLocalStorage from "../hooks/useLocalStorage";
import "../App.css";

function Dashboard() {

  const user = useContext(UserContext);

  const [expenses, setExpenses] = useLocalStorage("expenses", []);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    document.title = "Expense Tracker";
  }, []);

  const addExpense = (e) => {
    e.preventDefault();

    if (title === "" || amount === "") {
      return;
    }

    const newExpense = {
      title: title,
      amount: Number(amount)
    };

    setExpenses([...expenses, newExpense]);

    setTitle("");
    setAmount("");
  };

  const deleteExpense = (index) => {
    const updatedExpenses = expenses.filter(
      (_, i) => i !== index
    );

    setExpenses(updatedExpenses);
  };

  const total = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  return (
    <div className="container">

      <h1>EXPENSE TRACKER</h1>

      <div className="user-info">
        <h3>Welcome, {user.name}</h3>
        <p>Role: {user.role}</p>
      </div>

      <hr />

      <h2>Add Expense</h2>

      <form onSubmit={addExpense}>

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

        <button type="submit">
          Add Expense
        </button>

      </form>

      <h2>Expenses</h2>

      <div className="expense-list">

        {expenses.length === 0 ? (
          <p>No expenses added yet.</p>
        ) : (
          expenses.map((expense, index) => (
            <div className="expense-item" key={index}>

              <span>
                {expense.title}
              </span>

              <span>
                ₹{expense.amount}
              </span>

              <button
                onClick={() => deleteExpense(index)}
              >
                Delete
              </button>

            </div>
          ))
        )}

      </div>

      <hr />

      <div className="total">
        <h2>Total Expenses</h2>
        <h2>₹{total}</h2>
      </div>

    </div>
  );
}

export default Dashboard;