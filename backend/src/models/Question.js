const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
