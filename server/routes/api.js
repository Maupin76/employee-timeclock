// server/routes/api.js
const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const TimeLog = require("../models/TimeLog");

// 1. Register a new employee
router.post("/employees", async (req, res) => {
  try {
    const { name, employeeId, role } = req.body;

    // Check if employee ID already exists
    const existingEmployee = await Employee.findOne({ employeeId });
    if (existingEmployee) {
      return res.status(400).json({ error: "Employee ID already exists" });
    }

    const newEmployee = new Employee({ name, employeeId, role });
    await newEmployee.save();
    res
      .status(201)
      .json({
        message: "Employee registered successfully",
        employee: newEmployee,
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get all employees
router.get("/employees", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Log time (Clock In, Clock Out, Lunch Start, Lunch End)
router.post("/timelogs", async (req, res) => {
  try {
    const { employeeId, type, timestamp } = req.body;

    // Find employee by their unique employeeId string
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Create the time log (uses provided timestamp or defaults to current time)
    const logData = {
      employeeId: employee._id,
      type,
    };
    if (timestamp) {
      logData.timestamp = new Date(timestamp);
    }

    const newTimeLog = new TimeLog(logData);
    await newTimeLog.save();

    res.status(201).json({
      message: `Successfully recorded ${type} for ${employee.name}`,
      timeLog: newTimeLog,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get all time logs (with employee details populated)
router.get("/timelogs", async (req, res) => {
  try {
    const logs = await TimeLog.find()
      .populate("employeeId", "name employeeId role")
      .sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
