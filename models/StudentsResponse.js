const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  quizzes: [{
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    answers: [{
      question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      answer: String
    }]
  }]
});

module.exports = mongoose.model('Response', responseSchema);
