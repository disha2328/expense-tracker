import { createContext, useContext, useState, useEffect } from "react";

export const ExpenseContext = createContext(null);

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1"
    ? ""
    : "http://localhost:5001");
const API_BASE_URL = BACKEND_URL ? `${BACKEND_URL}/api/expenses` : "/api/expenses";

export function ExpenseProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState("checking");

  useEffect(() => {
    let ignore = false;

    async function loadExpenses() {
      try {
        const response = await fetch(API_BASE_URL, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }

        const result = await response.json();
        if (!ignore) {
          if (result.success && Array.isArray(result.data)) {
            const normalized = result.data.map((item) => ({
              ...item,
              id: item.id || item._id,
            }));
            setExpenses(normalized);
            setServerStatus("connected");
          } else {
            setExpenses(Array.isArray(result) ? result : []);
            setServerStatus("connected");
          }
        }
      } catch (err) {
        if (!ignore) {
          console.warn("[ExpenseContext] REST API fetch failed, using local state fallback:", err.message);
          setServerStatus("offline");
          setError("Backend API offline or unreachable. Using local fallback.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadExpenses();

    return () => {
      ignore = true;
    };
  }, []);

  // Securely add a new expense via POST /api/expenses
  const addExpense = async (expenseData) => {
    try {
      setError(null);
      const payload = {
        title: expenseData.title,
        amount: Number(expenseData.amount),
        category: expenseData.category || "General",
        date: expenseData.date || new Date().toISOString(),
        description: expenseData.description || "",
      };

      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        // Collect express-validator error messages if present
        if (result.errors && Array.isArray(result.errors)) {
          const errMsg = result.errors.map((e) => e.message || e.msg).join(", ");
          throw new Error(errMsg || result.message || "Validation failed");
        }
        throw new Error(result.message || "Failed to create expense");
      }

      const created = result.data || result;
      const normalized = {
        ...created,
        id: created.id || created._id,
      };

      setExpenses((current) => [normalized, ...current]);
      return { success: true, data: normalized };
    } catch (err) {
      console.warn("[ExpenseContext] POST failed, falling back to local state:", err.message);
      // Graceful local fallback for Experiment 1-3 compatibility
      const fallbackExpense = {
        id: expenseData.id || String(Date.now()),
        title: expenseData.title,
        amount: Number(expenseData.amount),
        category: expenseData.category || "General",
        date: expenseData.date || new Date().toISOString(),
      };
      setExpenses((current) => [fallbackExpense, ...current]);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Securely delete an expense via DELETE /api/expenses/:id
  const deleteExpense = async (id) => {
    try {
      setError(null);
      // Check if id is a 24-character hexadecimal MongoDB ObjectId
      const isMongoId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);

      if (isMongoId && serverStatus === "connected") {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.message || "Failed to delete expense");
        }
      }

      // Update local state
      setExpenses((current) =>
        current.filter((expense) => expense.id !== id && expense._id !== id)
      );
      return { success: true };
    } catch (err) {
      console.error("[ExpenseContext] DELETE failed:", err.message);
      setError(err.message);
      // Still remove locally for responsive UI
      setExpenses((current) =>
        current.filter((expense) => expense.id !== id && expense._id !== id)
      );
      return { success: false, error: err.message };
    }
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        loading,
        error,
        serverStatus,
        addExpense,
        deleteExpense,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  return useContext(ExpenseContext);
}

export default ExpenseContext;
