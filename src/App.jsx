import { useState } from 'react'

function App() {
  const [expenses, setExpenses] = useState([])
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')

  const addExpense = () => {
    if (name === '' || amount === '') {
      alert('Please enter expense name and amount')
      return
    }

    const newExpense = {
      id: Date.now(),
      name: name,
      amount: Number(amount),
      category: category
    }

    setExpenses([...expenses, newExpense])

    setName('')
    setAmount('')
  }

  const deleteExpense = (id) => {
    setExpenses(expenses.filter((expense) => expense.id !== id))
  }

  const total = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  )

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">

      <div className="max-w-4xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600">
            Expense Tracker
          </h1>

          <p className="text-gray-600 mt-2">
            Track your daily expenses easily
          </p>
        </div>

        {/* Total */}
        <div className="bg-blue-600 text-white rounded-xl shadow-lg p-6 text-center mb-6">
          <p className="text-lg">
            Total Expenses
          </p>

          <h2 className="text-4xl font-bold mt-2">
            ₹{total}
          </h2>
        </div>

        {/* Add Expense */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">

          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Add Expense
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <input
              type="text"
              placeholder="Expense name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Food</option>
              <option>Travel</option>
              <option>Shopping</option>
              <option>Education</option>
              <option>Other</option>
            </select>

          </div>

          <button
            onClick={addExpense}
            className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg"
          >
            Add Expense
          </button>

        </div>

        {/* Expense List */}
        <div className="bg-white rounded-xl shadow-lg p-6">

          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Expense List
          </h2>

          {expenses.length === 0 ? (
            <p className="text-gray-500 text-center">
              No expenses added yet.
            </p>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 py-4"
              >

                <div>
                  <h3 className="font-bold text-gray-800">
                    {expense.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {expense.category}
                  </p>
                </div>

                <div className="flex items-center gap-3">

                  <span className="font-bold text-red-500">
                    ₹{expense.amount}
                  </span>

                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>

                </div>

              </div>
            ))
          )}

        </div>

      </div>

    </div>
  )
}

export default App