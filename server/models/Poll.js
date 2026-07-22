const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    question: {
      type: String,
      required: true,
      maxlength: 500,
    },
    category: {
      type: String,
      enum: ['understanding', 'revision', 'pace', 'doubt', 'feedback'],
      required: true,
    },
    responseType: {
      type: String,
      enum: ['yesno', 'rating'],
      required: true,
    },
    timer: {
      type: Number,
      enum: [3, 5, 10],
      default: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    launchedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Poll', pollSchema);
