import { useExpenses } from "../context/ExpenseContext";

function Dashboard() {
  const { expenses, deleteExpense, loading, serverStatus, error } = useExpenses();

  const total = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="dashboard-container">
      {/* Security Status Banner for Experiment 5 */}
      <div className="security-banner">
        <div className="security-banner-info">
          <span className="security-icon">🔒</span>
          <div>
            <strong>Experiment 5: Securing REST APIs Active</strong>
            <p>Helmet • Strict CORS • Rate Limiting (100 req/15m) • express-validator • NoSQL Defense</p>
          </div>
        </div>
        <div className="server-status-pill">
          <span
            className={`status-dot ${
              serverStatus === "connected" ? "status-online" : "status-offline"
            }`}
          />
          {serverStatus === "connected" ? "API Live (Port 5001)" : "Local Mode"}
        </div>
      </div>

      {error && <div className="alert-warning">⚠️ Notice: {error}</div>}

      {/* Overview Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Total Expenses</span>
          <h2 className="stat-value">₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Transactions</span>
          <h2 className="stat-value">{expenses.length}</h2>
        </div>
      </div>

      {/* Expenses List */}
      <div className="expenses-card">
        <div className="card-header">
          <h2>All Expenses</h2>
          <span className="count-badge">{expenses.length} entries</span>
        </div>

        {loading ? (
          <div className="loading-state">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <p>No expenses added yet. Add your first expense above!</p>
          </div>
        ) : (
          <div className="expense-list">
            {expenses.map((expense, index) => {
              const itemKey = expense.id || expense._id || `expense-${index}`;
              return (
                <div key={itemKey} className="expense-item">
                  <div className="expense-item-left">
                    <div className="expense-title-row">
                      <span className="expense-title">{expense.title}</span>
                      <span className="category-pill">{expense.category || "General"}</span>
                    </div>
                    <div className="expense-meta">
                      {expense.date && <span>📅 {formatDate(expense.date)}</span>}
                      {expense.description && (
                        <span className="expense-desc">• {expense.description}</span>
                      )}
                    </div>
                  </div>

                  <div className="expense-item-right">
                    <span className="expense-amount">
                      ₹{Number(expense.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => deleteExpense(expense.id || expense._id)}
                      className="btn-delete"
                      title="Delete expense"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
