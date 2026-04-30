/**
 * models/User.js
 * Mongoose schema for registered users (students & admins).
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 60,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  savedQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
