const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema(
  {
    poll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // For 'yesno': 'yes' or 'no'. For 'rating': '1'-'5'
    answer: {
      type: String,
      required: true,
      maxlength: 10,
    },
  },
  { timestamps: true }
);

// Each student can only respond once per poll
responseSchema.index({ poll: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Response', responseSchema);
