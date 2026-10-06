// server/routes/api.js
const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const TimeLog = require("../models/TimeLog");

// 1. Register a new user/employee
router.post("/users/register", async (req, res) => {
  try {
    const { username, pin, firstName, lastName, email } = req.body;

    // Check if username already exists
    const existingEmployee = await Employee.findOne({ username });
    if (existingEmployee) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const newEmployee = new Employee({
      username,
      pin,
      firstName,
      lastName,
      email,
    });
    await newEmployee.save();

    res.status(201).json({
      message: "Account created successfully",
      user: newEmployee,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Login user/employee with username and PIN
router.post("/users/login", async (req, res) => {
  try {
    const { username, pin } = req.body;
    const employee = await Employee.findOne({ username });

    if (!employee) {
      return res.status(404).json({ message: "User not found" });
    }

    if (employee.pin !== pin) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    res.json({ message: "Login successful", user: employee });
  } catch (err) {
    res.status(500).json({ message: "Server error during login" });
  }
});

// 3. Get all employees
router.get("/employees", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Log time (Clock in, Clock out, Go to lunch, Back from lunch)
router.post("/timelogs", async (req, res) => {
  try {
    const { userId, logString, action } = req.body;

    // Find employee by their ID
    const employee = await Employee.findById(userId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const newTimeLog = new TimeLog({
      userId: employee._id,
      logString,
      action,
    });

    await newTimeLog.save();

    res.status(201).json({
      message: `Successfully recorded time log`,
      timeLog: newTimeLog,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get all time logs (with employee details populated)
router.get("/timelogs", async (req, res) => {
  try {
    const logs = await TimeLog.find()
      .populate("userId", "firstName lastName username email role")
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
