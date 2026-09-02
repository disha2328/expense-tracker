import { useExpenses } from "../context/ExpenseContext";

function Dashboard() {
  const { expenses, deleteExpense } = useExpenses();

  const total = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  return (
    <div>
      <h1>Expense Dashboard</h1>

      <h2>Total Expense: ₹{total}</h2>

      <h2>All Expenses</h2>

      {expenses.length === 0 ? (
        <p>No expenses added yet.</p>
      ) : (
        expenses.map((expense) => (
          <div key={expense.id}>
            <p>
              {expense.title} - ₹{expense.amount}
            </p>

            <button onClick={() => deleteExpense(expense.id)}>
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default Dashboard;