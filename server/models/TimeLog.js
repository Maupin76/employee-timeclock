// server/models/TimeLog.js
const mongoose = require("mongoose");

const timeLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  logString: { type: String, required: true }, // e.g., "10/5/2026 Douglas Maupin Clock in 11:00 AM"
  action: { type: String, required: true }, // e.g., "Clock in", "Clock out", "Go to lunch"
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TimeLog", timeLogSchema);
