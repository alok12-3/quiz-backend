const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    graduationYear: { type: Number, required: true },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
}) 

module.exports = mongoose.model('School', schoolSchema);