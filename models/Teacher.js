const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true},
  name: { type: String, unique: true, required: true},
  subjects: [{ type: String, required: true }],
  className: [{type: mongoose.Schema.Types.ObjectId, ref:'Schools', required: true}],
  section: [{ type: String, required: true}],

  bookmarkedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  schoolId: { type: String},
  quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Teacher', teacherSchema);
