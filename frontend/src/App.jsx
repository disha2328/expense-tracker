import { useState, useEffect } from "react";
import AddExpense from "./components/AddExpense";
import Dashboard from "./components/Dashboard";
import Chat from "./components/Chat";
import "./App.css";

function App() {
  const [dockerMessage, setDockerMessage] = useState("Connecting to backend...");
  const [dockerConnected, setDockerConnected] = useState(false);

  useEffect(() => {
    // Check backend API connectivity (works via reverse proxy or direct port 5001/5000)
    const checkBackend = async () => {
      // Check environment variable for cloud-deployed Render backend first
      if (import.meta.env.VITE_BACKEND_URL) {
        try {
          const resCloud = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api`);
          if (resCloud.ok) {
            const data = await resCloud.json();
            setDockerMessage(data.message || "Backend is running online on Render!");
            setDockerConnected(true);
            return;
          }
        } catch (_) {}
      }

      try {
        const res = await fetch("/api");
        if (res.ok) {
          const data = await res.json();
          setDockerMessage(data.message || "Backend is running inside Docker!");
          setDockerConnected(true);
          return;
        }
      } catch (_) {}

      try {
        const resDirect = await fetch("http://localhost:5001/api");
        if (resDirect.ok) {
          const data = await resDirect.json();
          setDockerMessage(data.message || "Backend is running inside Docker!");
          setDockerConnected(true);
          return;
        }
      } catch (_) {}

      try {
        const resPort5000 = await fetch("http://localhost:5000/api");
        if (resPort5000.ok) {
          const data = await resPort5000.json();
          setDockerMessage(data.message || "Backend is running inside Docker!");
          setDockerConnected(true);
          return;
        }
      } catch (_) {}

      setDockerMessage("Backend connection failed");
      setDockerConnected(false);
    };

    checkBackend();
  }, []);

  return (
    <div className="app-container">
      {/* Experiment 7: Full Stack Docker Application Header */}
      <section className="docker-card">
        <div className="docker-badge-icon">🐳</div>
        <h1 className="docker-title">Full Stack Docker Application</h1>
        <p className="docker-subtitle">Frontend: React</p>
        <div className={`docker-response-pill ${dockerConnected ? "connected" : "connecting"}`}>
          Backend Response: <strong>{dockerMessage}</strong>
        </div>
      </section>

      {/* Expense Tracker Header & Core Application */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">💰</div>
          <div>
            <h1>Expense Tracker</h1>
            <p className="subtitle">DevOps & CI/CD • Experiment 10: CI/CD Deployment with GitHub Actions + Render/Vercel</p>
          </div>
        </div>
      </header>

      {/* Experiment 8: Real-Time Communication via WebSockets */}
      <Chat />

      <main className="main-content">
        <AddExpense />
        <Dashboard />
      </main>

      <footer className="app-footer">
        <p>Expense Tracker • Dockerized Full-Stack Application (Frontend: Nginx:Alpine, Backend: Node:22-Alpine, Database: MongoDB)</p>
      </footer>
    </div>
  );
}

export default App;

