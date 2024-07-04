

const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  selectedOption: { type: String, required: true },
  correctOption: { type: String, required: true },
});

const historySchema = new mongoose.Schema({
  username: { type: String, required: true },
  answers: [answerSchema],
});

module.exports = mongoose.model('History', historySchema);
