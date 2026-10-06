// server/models/Employee.js
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  pin: { type: String, required: true, trim: true }, // 4-digit PIN stored as string
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  role: { type: String, default: "Employee" },
  employeeId: {
    type: String,
    default: () => `EMP-${Math.floor(100000 + Math.random() * 900000)}`,
    sparse: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Employee", employeeSchema);
