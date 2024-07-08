const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true},
  name: { type: String, required: true },
  class: { type: String, required: true },
  section: { type: String, required: true },
  id: { type: String, unique: true },
  age: { type: Number, required: true },
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  //teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher'}],
  assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz'}],
  correctquestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  wrongquestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  totalquestions: { type: Number, default: 0 },
  schoolId: { type: mongoose.Schema.Types.ObjectId, required: true },
});

module.exports = mongoose.model('Student', studentSchema);
