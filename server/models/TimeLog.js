// server/models/TimeLog.js
const mongoose = require("mongoose");

const timeLogSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  type: {
    type: String,
    enum: ["IN", "OUT", "LUNCH_START", "LUNCH_END"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TimeLog", timeLogSchema);
