const mongoose = require('mongoose');
const crypto = require('crypto');

const instituteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    instituteId: {
      type: String,
      unique: true,
      required: true,
      default: () => crypto.randomBytes(4).toString('hex').toUpperCase(),
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Institute', instituteSchema);
