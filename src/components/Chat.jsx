import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function Chat() {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem("chat_username") || "";
  });
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [transportMode, setTransportMode] = useState("connecting");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Save username changes
    if (username.trim()) {
      localStorage.setItem("chat_username", username.trim());
    }
  }, [username]);

  useEffect(() => {
    // Determine backend Socket.IO connection URL
    // Supports both direct port 5001 and Nginx proxy
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const socketServerUrl =
      import.meta.env.VITE_BACKEND_URL ||
      (isLocal ? `http://${window.location.hostname}:5001` : window.location.origin);

    const socket = io(socketServerUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket.IO] Connected with ID:", socket.id);
      setConnected(true);
      setTransportMode(socket.io.engine.transport.name || "websocket");
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket.IO] Disconnected:", reason);
      setConnected(false);
      setTransportMode("disconnected");
    });

    socket.on("chatMessage", (data) => {
      console.log("[Socket.IO] Received message:", data);
      setMessages((prev) => [...prev, data]);
    });

    // Clean up Socket.IO connection when component unmounts
    return () => {
      console.log("[Socket.IO] Disconnecting socket on unmount");
      socket.disconnect();
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();

    const trimmedUser = username.trim();
    const trimmedMsg = message.trim();

    if (!trimmedUser) {
      alert("Please enter a username first.");
      return;
    }

    if (!trimmedMsg) {
      return;
    }

    if (!socketRef.current || !connected) {
      alert("Chat is not connected to the server yet. Please wait a moment.");
      return;
    }

    const payload = {
      username: trimmedUser,
      message: trimmedMsg,
    };

    // Emit message to backend via WebSocket
    socketRef.current.emit("chatMessage", payload);

    // Clear message input field
    setMessage("");
  };

  return (
    <section className="chat-section">
      <div className="chat-card">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <span className="chat-icon">💬</span>
            <div>
              <h2 className="chat-title">Real-Time Team Chat</h2>
              <p className="chat-subtitle">
                Experiment 8: WebSockets & Socket.IO Communication
              </p>
            </div>
          </div>
          <div className="chat-header-right">
            <span
              className={`status-indicator ${connected ? "online" : "offline"}`}
              id="chat-status-badge"
            >
              <span className="status-dot"></span>
              {connected ? "Connected" : "Connecting..."}
            </span>
          </div>
        </div>

        {/* Username Configuration Banner */}
        <div className="chat-user-bar">
          <label htmlFor="chat-username" className="chat-label">
            Your Username:
          </label>
          <input
            id="chat-username"
            type="text"
            className="chat-username-input"
            placeholder="Enter your name (e.g., Student 1 or Student 2)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {/* Message List */}
        <div className="chat-messages-container" id="chat-messages-box">
          {messages.length === 0 ? (
            <div className="chat-empty-state">
              <span className="chat-empty-icon">✉️</span>
              <p>No messages yet. Open another tab or browser to start chatting!</p>
              <small className="chat-hint">
                Type a message below to broadcast in real time.
              </small>
            </div>
          ) : (
            messages.map((item, index) => {
              const isOwn =
                username.trim() &&
                item.username.toLowerCase() === username.trim().toLowerCase();
              return (
                <div
                  key={item.id || index}
                  className={`chat-message-row ${
                    isOwn ? "chat-message-own" : "chat-message-other"
                  }`}
                >
                  <div className="chat-bubble">
                    <div className="chat-bubble-header">
                      <strong className="chat-sender">{item.username}</strong>
                      <span className="chat-timestamp">
                        {item.timestamp || "Just now"}
                      </span>
                    </div>
                    <div className="chat-text">{item.message}</div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Form */}
        <form onSubmit={sendMessage} className="chat-form">
          <input
            type="text"
            className="chat-input"
            placeholder="Type a message (e.g., Hello Student 2!)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!connected}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!connected || !message.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
