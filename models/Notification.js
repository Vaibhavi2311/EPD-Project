/**
 * models/Notification.js
 * Notifications broadcast by admin to all users.
 */

const mongoose = require('mongoose');

const notifSchema = new mongoose.Schema({
  title:   { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['info', 'important', 'update'],
    default: 'info',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notifSchema);
