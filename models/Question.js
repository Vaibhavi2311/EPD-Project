/**
 * models/Question.js
 * Mongoose schema for exam questions.
 */

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
  },
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    minlength: 5,
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    trim: true,
  },
  marks: {
    type: Number,
    default: null,
  },
  // How many times this Q has appeared – drives "important" flag
  frequency: {
    type: Number,
    default: 1,
  },
  isImportant: {
    type: Boolean,
    default: false,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

questionSchema.index({ subject: 1, topic: 1 });

module.exports = mongoose.model('Question', questionSchema);
