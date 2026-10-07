import React, { useState, useEffect } from "react";
import logoImg from "./assets/TSBLogo.png"; // Import the logo image

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

  // Secure Admin Log Viewer States
  const [viewingLogs, setViewingLogs] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Edit / Update Log States
  const [editingLogId, setEditingLogId] = useState(null);
  const [editedLogString, setEditedLogString] = useState("");

  // Fetch all time logs for the secure report/viewer
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`${API_URL}/api/timelogs`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data);
      } else {
        setStatusMessage("Failed to load logs.");
      }
    } catch (err) {
      setStatusMessage("Error connecting to server for logs.");
    }
    setLoadingLogs(false);
  };

  // Automatically check and restore user status based on their last log today
  const checkUserStatus = async (user) => {
    try {
      const res = await fetch(`${API_URL}/api/timelogs`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const userId = user._id || user.id;
        const userLogs = data.filter((log) => log.userId === userId);

        if (userLogs.length > 0) {
          const latestLog = userLogs[userLogs.length - 1];
          const nowStr = new Date().toLocaleDateString();
          const logDateStr = latestLog.logString.split(" ")[0];

          // If the last log was today, restore their exact state
          if (logDateStr === nowStr) {
            if (
              latestLog.action === "Clock in" ||
              latestLog.action === "Back from lunch"
            ) {
              setCurrentStatus("Clocked In");
            } else if (latestLog.action === "Go to lunch") {
              setCurrentStatus("On Lunch");
            } else if (latestLog.action === "Clock out") {
              setCurrentStatus("Out");
            }
          } else {
            // New day (e.g. missed clock out yesterday), default to Out for a fresh clock-in
            setCurrentStatus("Out");
          }
        } else {
          setCurrentStatus("Out");
        }
      }
    } catch (err) {
      setCurrentStatus("Out");
    }
  };

  // Handle Admin Login for Logs
  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (adminUsername === "Maupin76" && adminPin === "5452") {
      setIsAdminLoggedIn(true);
      setStatusMessage("");
      fetchLogs();
    } else {
      setStatusMessage("Access Denied: Invalid Admin Credentials");
    }
  };

  // Handle Delete Log Entry
  const handleDeleteLog = async (id) => {
    if (!window.confirm("Are you sure you want to delete this log entry?"))
      return;
    try {
      const res = await fetch(`${API_URL}/api/timelogs/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setLogs(logs.filter((log) => (log._id || log.id) !== id));
      } else {
        alert("Failed to delete log entry.");
      }
    } catch (err) {
      alert("Error connecting to server to delete log.");
    }
  };

  // Handle Update / Save Log Entry
  const handleUpdateLog = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/timelogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logString: editedLogString }),
      });
      if (res.ok) {
        setEditingLogId(null);
        fetchLogs();
      } else {
        alert("Failed to update log entry.");
      }
    } catch (err) {
      alert("Error connecting to server to update log.");
    }
  };

  // Handle Regular User Login or Registration
  const handleAuth = async (e) => {
    e.preventDefault();
    setStatusMessage("");

    try {
      if (isRegistering) {
        const res = await fetch(`${API_URL}/api/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, pin, firstName, lastName, email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed");

        setCurrentUser(data.user);
        setCurrentStatus("Out");
        setStatusMessage("Account created successfully!");
      } else {
        const res = await fetch(`${API_URL}/api/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, pin }),
        });
        const data = await res.json();

        if (res.status === 404) {
          setIsRegistering(true);
          setStatusMessage(
            "Account not found. Please complete details to create one.",
          );
          return;
        }
        if (!res.ok) throw new Error(data.message || "Invalid username or PIN");

        setCurrentUser(data.user);
        await checkUserStatus(data.user); // Automatically check and restore current status
      }
    } catch (err) {
      setStatusMessage(err.message);
    }
  };

  // Handle Time Actions (Clock In, Clock Out, Lunch)
  const handleAction = async (actionType) => {
    if (!currentUser) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

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

        {/* --- LOGO IMAGE IMPORTED FROM ASSETS --- */}
        <div style={styles.logoContainer}>
          <img
            src={logoImg}
            alt="Thai Street Bistro Logo"
            style={styles.logoImage}
          />
        </div>

        {statusMessage && <p style={styles.message}>{statusMessage}</p>}

        {viewingLogs && !isAdminLoggedIn ? (
          /* --- ADMIN CREDENTIALS PROMPT --- */
          <form onSubmit={handleAdminAuth} style={styles.form}>
            <h3
              style={{
                color: "#ffc107",
                margin: "0 0 8px 0",
                fontSize: "16px",
              }}
            >
              Restricted Access
            </h3>
            <p
              style={{ fontSize: "13px", color: "#aaa", marginBottom: "12px" }}
            >
              Enter Admin Credentials to View Reports
            </p>
            <input
              type="text"
              placeholder="Admin Username"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="password"
              maxLength="4"
              placeholder="Admin PIN"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              required
              style={styles.input}
            />
            <button type="submit" style={styles.primaryButton}>
              Unlock Reports
            </button>
            <button
              type="button"
              onClick={() => {
                setViewingLogs(false);
                setStatusMessage("");
              }}
              style={styles.logoutButton}
            >
              Cancel
            </button>
          </form>
        ) : viewingLogs && isAdminLoggedIn ? (
          /* --- SPREADSHEET TIME LOGS & PRINT REPORT VIEW --- */
          <div style={styles.dashboard}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "16px", color: "#ffc107" }}>
                Timesheet Spreadsheet
              </h3>
              <button onClick={() => window.print()} style={styles.printButton}>
                🖨️ Print / Save PDF
              </button>
            </div>

            <div style={styles.tableContainer}>
              {loadingLogs ? (
                <p style={{ color: "#aaa", padding: "10px" }}>
                  Loading spreadsheet logs...
                </p>
              ) : logs.length === 0 ? (
                <p style={{ color: "#aaa", padding: "10px" }}>
                  No time logs recorded yet.
                </p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.th}>Log Details / Spreadsheet Entry</th>
                      <th style={{ ...styles.th, textAlign: "right" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const logId = log._id || log.id;
                      const isEditing = editingLogId === logId;

                      return (
                        <tr key={logId} style={styles.tableRow}>
                          <td style={styles.td}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editedLogString}
                                onChange={(e) =>
                                  setEditedLogString(e.target.value)
                                }
                                style={styles.editInput}
                              />
                            ) : (
                              <span style={styles.logText}>
                                {log.logString}
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              ...styles.td,
                              textAlign: "right",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleUpdateLog(logId)}
                                  style={styles.saveBtn}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingLogId(null)}
                                  style={styles.cancelBtn}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingLogId(logId);
                                    setEditedLogString(log.logString);
                                  }}
                                  style={styles.editBtn}
                                  title="Edit Entry"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteLog(logId)}
                                  style={styles.deleteBtn}
                                  title="Delete Entry"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <button
              onClick={() => {
                setViewingLogs(false);
                setIsAdminLoggedIn(false);
              }}
              style={styles.logoutButton}
            >
              Back to Time Clock
            </button>
          </div>
        ) : !currentUser ? (
          /* --- LOGIN / REGISTER VIEW --- */
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

            <button
              type="button"
              onClick={() => {
                setViewingLogs(true);
                setAdminUsername("");
                setAdminPin("");
                setStatusMessage("");
              }}
              style={styles.viewLogsLinkButton}
            >
              🔒 Admin View Time Logs / Report
            </button>
          </form>
        ) : (
          /* --- EMPLOYEE CLOCK DASHBOARD --- */
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
    maxWidth: "480px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
    textAlign: "center",
  },
  title: {
    fontFamily: "Montserrat, sans-serif",
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "4px",
    color: "#ffc107",
  },
  subtitle: {
    fontSize: "14px",
    color: "#aaa",
    marginBottom: "16px",
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
    marginTop: "4px",
  },
  viewLogsLinkButton: {
    backgroundColor: "transparent",
    border: "none",
    color: "#aaa",
    fontSize: "13px",
    cursor: "pointer",
    textDecoration: "underline",
    marginTop: "8px",
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
  logoContainer: {
    marginBottom: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: "100%",
    maxWidth: "200px",
    height: "auto",
    objectFit: "contain",
    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
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
    marginTop: "10px",
  },
  printButton: {
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },
  tableContainer: {
    textAlign: "left",
    maxHeight: "380px",
    overflowY: "auto",
    backgroundColor: "#191919",
    border: "1px solid #333",
    borderRadius: "8px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  tableHeaderRow: {
    backgroundColor: "#222",
    borderBottom: "2px solid #444",
  },
  th: {
    padding: "10px",
    color: "#ffc107",
    fontWeight: "bold",
  },
  tableRow: {
    borderBottom: "1px solid #282828",
  },
  td: {
    padding: "8px 10px",
    color: "#ddd",
  },
  logText: {
    fontFamily: "monospace",
  },
  editInput: {
    width: "100%",
    padding: "4px 6px",
    backgroundColor: "#111",
    border: "1px solid #ffc107",
    color: "#fff",
    borderRadius: "4px",
    fontSize: "12px",
  },
  editBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    marginRight: "4px",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
  },
  saveBtn: {
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "bold",
    marginRight: "4px",
  },
  cancelBtn: {
    backgroundColor: "#6c757d",
    color: "#fff",
    border: "none",
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px",
  },
};
