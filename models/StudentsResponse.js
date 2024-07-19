const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  quizzes: [{
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    answers: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      questionstring: String, 
      answer: String,
      geminiresponse: String
    }]
  }]
});

module.exports = mongoose.model('Response', responseSchema);
