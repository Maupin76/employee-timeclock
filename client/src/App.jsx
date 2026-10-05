import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState("Out"); // 'Clocked In', 'On Lunch', 'Out'

  // Handle Login or Check Existing Account
  const handleAuth = async (e) => {
    e.preventDefault();
    setStatusMessage("");

    try {
      if (isRegistering) {
        // Register new user
        const res = await fetch(`${API_URL}/api/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, pin, firstName, lastName, email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed");

        setCurrentUser(data.user);
        setStatusMessage("Account created successfully!");
      } else {
        // Login existing user
        const res = await fetch(`${API_URL}/api/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, pin }),
        });
        const data = await res.json();

        if (res.status === 404) {
          // Account doesn't exist, switch to register mode automatically
          setIsRegistering(true);
          setStatusMessage(
            "Account not found. Please complete details to create one.",
          );
          return;
        }
        if (!res.ok) throw new Error(data.message || "Invalid username or PIN");

        setCurrentUser(data.user);
      }
    } catch (err) {
      setStatusMessage(err.message);
    }
  };

  // Handle Time Actions (Clock In, Clock Out, Lunch)
  const handleAction = async (actionType) => {
    if (!currentUser) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString(); // e.g., 10/5/2026
    const timeStr = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }); // e.g., 11:00 AM

    // Format: 10/5/2026 Douglas Maupin Clock in 11:00 AM
    const formattedLog = `${dateStr} ${currentUser.firstName} ${currentUser.lastName} ${actionType} ${timeStr}`;

    try {
      const res = await fetch(`${API_URL}/api/timelogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser._id || currentUser.id,
          logString: formattedLog,
          action: actionType,
        }),
      });

      if (!res.ok) throw new Error("Failed to record action");

      if (actionType === "Clock in") setCurrentStatus("Clocked In");
      if (actionType === "Clock out") setCurrentStatus("Out");
      if (actionType === "Go to lunch") setCurrentStatus("On Lunch");
      if (actionType === "Back from lunch") setCurrentStatus("Clocked In");

      setStatusMessage(`Success: Recorded "${actionType}"`);
    } catch (err) {
      setStatusMessage("Error saving timestamp. Please try again.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Thai Street Bistro</h1>
        <p style={styles.subtitle}>Employee Time Clock</p>

        {statusMessage && <p style={styles.message}>{statusMessage}</p>}

        {!currentUser ? (
          <form onSubmit={handleAuth} style={styles.form}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="password"
              maxLength="4"
              placeholder="4-Digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              style={styles.input}
            />

            {isRegistering && (
              <>
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  style={styles.input}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                />
              </>
            )}

            <button type="submit" style={styles.primaryButton}>
              {isRegistering ? "Create Account & Login" : "Login"}
            </button>

            <p
              style={styles.toggleText}
              onClick={() => {
                setIsRegistering(!isRegistering);
                setStatusMessage("");
              }}
            >
              {isRegistering
                ? "Already have an account? Login"
                : "Don't have an account? Create one"}
            </p>
          </form>
        ) : (
          <div style={styles.dashboard}>
            <p style={styles.welcomeText}>
              Welcome,{" "}
              <strong>
                {currentUser.firstName} {currentUser.lastName}
              </strong>
            </p>
            <p style={styles.statusText}>
              Current Status:{" "}
              <span style={{ color: "#ffc107" }}>{currentStatus}</span>
            </p>

            <div style={styles.buttonGroup}>
              {currentStatus !== "Clocked In" &&
                currentStatus !== "On Lunch" && (
                  <button
                    onClick={() => handleAction("Clock in")}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: "#28a745",
                    }}
                  >
                    Clock In
                  </button>
                )}

              {currentStatus === "Clocked In" && (
                <>
                  <button
                    onClick={() => handleAction("Go to lunch")}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: "#ffc107",
                      color: "#000",
                    }}
                  >
                    Go to Lunch
                  </button>
                  <button
                    onClick={() => handleAction("Clock out")}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: "#dc3545",
                    }}
                  >
                    Clock Out
                  </button>
                </>
              )}

              {currentStatus === "On Lunch" && (
                <button
                  onClick={() => handleAction("Back from lunch")}
                  style={{ ...styles.actionButton, backgroundColor: "#17a2b8" }}
                >
                  Back From Lunch
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setCurrentUser(null);
                setPin("");
                setStatusMessage("");
              }}
              style={styles.logoutButton}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#000000",
    color: "#ffffff",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: "#121212",
    border: "1px solid #333",
    borderRadius: "16px",
    padding: "24px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
    textAlign: "center",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "4px",
    color: "#ffc107",
  },
  subtitle: {
    fontSize: "14px",
    color: "#aaa",
    marginBottom: "24px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #444",
    backgroundColor: "#1e1e1e",
    color: "#fff",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  primaryButton: {
    backgroundColor: "#ffc107",
    color: "#000",
    padding: "14px",
    borderRadius: "8px",
    border: "none",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "8px",
  },
  toggleText: {
    color: "#4dabf7",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "12px",
  },
  message: {
    backgroundColor: "#1e1e1e",
    border: "1px solid #444",
    padding: "10px",
    borderRadius: "6px",
    fontSize: "14px",
    marginBottom: "16px",
    color: "#ffc107",
  },
  dashboard: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  welcomeText: {
    fontSize: "18px",
    marginBottom: "4px",
  },
  statusText: {
    fontSize: "14px",
    color: "#aaa",
    marginBottom: "12px",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  actionButton: {
    width: "100%",
    padding: "20px",
    borderRadius: "50px",
    border: "none",
    color: "#fff",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  },
  logoutButton: {
    backgroundColor: "transparent",
    border: "1px solid #555",
    color: "#aaa",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "20px",
  },
};
