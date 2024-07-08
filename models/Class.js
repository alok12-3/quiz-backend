// const mongoose = require('mongoose');

// const classSchema = new mongoose.Schema({
//     className: { type: String, unique:true, required: true },
//     year: { type: String, required: true },
//     grade: { type: String, required: true },
//     createdAt: { type: Date, default: Date.now },
//     class: { type: String, required: true },
//     section: { type: String, required: true },
//     schoolId: { type: mongoose.Schema.Types.ObjectId, ref:'School', required: true},
//     students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
//     teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher'}],
//     createdAt: { type: Date, default: Date.now},
//     updatedAt: { type: Date, default: Date.now}
// });

// module.exports = mongoose.model('Class', classSchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const classSchema = new Schema({
  className: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
  schoolId: {
    type: String,
  
  
  },
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
