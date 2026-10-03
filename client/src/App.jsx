import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./App.css";

function App() {
  const [scannedEmployeeId, setScannedEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [actionType, setActionType] = useState("IN");
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customTimestamp, setCustomTimestamp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const scannerRef = useRef(null);

  useEffect(() => {
    // Initialize QR Code Scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    );

    scanner.render(
      async (decodedText) => {
        // Successfully scanned a QR code!
        // Assuming the QR code contains the employee's unique employeeId string (e.g., "EMP001")
        setScannedEmployeeId(decodedText);
        setMessage(`Scanned ID: ${decodedText}`);
        setError("");

        // Optional: Look up employee name to display on screen
        try {
          const res = await fetch("http://localhost:5000/api/employees");
          const employees = await res.json();
          const found = employees.find((emp) => emp.employeeId === decodedText);
          if (found) {
            setEmployeeName(found.name);
          } else {
            setEmployeeName("Unknown Employee");
          }
        } catch (err) {
          console.error("Error fetching employees:", err);
        }
      },
      (errorMessage) => {
        // parse error, ignore or handle quietly
      },
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error) => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, []);

  const handleTimeLogSubmit = async (e) => {
    e.preventDefault();
    if (!scannedEmployeeId) {
      setError("Please scan an employee QR code first.");
      return;
    }

    const payload = {
      employeeId: scannedEmployeeId,
      type: actionType,
    };

    if (useCustomTime && customTimestamp) {
      payload.timestamp = customTimestamp;
    }

    try {
      const response = await fetch("http://localhost:5000/api/timelogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to log time");

      setMessage(`Success! ${data.message}`);
      setError("");
      // Reset scan selection after successful punch
      setScannedEmployeeId("");
      setEmployeeName("");
    } catch (err) {
      setError(err.message);
      setMessage("");
    }
  };

  return (
    <div className="container">
      <h1>Employee Time Clock</h1>

      <div className="scanner-section">
        <h3>Scan Employee QR Code</h3>
        <div
          id="reader"
          style={{ width: "100% maxWidth: 500px", margin: "0 auto" }}
        ></div>
      </div>

      {scannedEmployeeId && (
        <div className="action-section">
          <h2>Employee: {employeeName || scannedEmployeeId}</h2>
          <form onSubmit={handleTimeLogSubmit}>
            <div className="form-group">
              <label>Select Action: </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
              >
                <option value="IN">Clock In</option>
                <option value="OUT">Clock Out</option>
                <option value="LUNCH_START">Lunch Start</option>
                <option value="LUNCH_END">Lunch End</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={useCustomTime}
                  onChange={(e) => setUseCustomTime(e.target.checked)}
                />
                Use Custom Time Override
              </label>
            </div>

            {useCustomTime && (
              <div className="form-group">
                <label>Custom Date & Time: </label>
                <input
                  type="datetime-local"
                  value={customTimestamp}
                  onChange={(e) => setCustomTimestamp(e.target.value)}
                />
              </div>
            )}

            <button type="submit" className="submit-btn">
              Submit Time Log
            </button>
          </form>
        </div>
      )}

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}
    </div>
  );
}

export default App;
