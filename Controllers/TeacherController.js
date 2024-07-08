const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const Class = require('../models/Class');

exports.createTeacher = async (req, res) => {
  try {
    const teacher = new Teacher(req.body);
    await teacher.save();
    res.status(201).json({ username: teacher.username });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ username: req.params.username })
      .populate('bookmarkedQuestions', 'question _id')
      .populate('quizzes', 'title _id');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json(teacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getClassSections = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('classSections.students');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json(teacher.classSections);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getBookmarkedQuestions = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('bookmarkedQuestions');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json(teacher.bookmarkedQuestions);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getQuizzes = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('quizzes');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    res.json(teacher.quizzes);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getQuestionDetails = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.addClassSection = async (req, res) => {
  try {
    const { class: className, section, students } = req.body;
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const studentsIds = await Student.find({ _id: { $in: students } }, '_id');
    teacher.classSections.push({ class: className, section, students: studentsIds });
    await teacher.save();

    res.json(teacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.bookmarkQuestion = async (req, res) => {
  try {
    const { questionId } = req.body;
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (!teacher.bookmarkedQuestions.includes(questionId)) {
      teacher.bookmarkedQuestions.push(questionId);
      await teacher.save();
    }

    res.json(teacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.createQuiz = async (req, res) => {
  try {
    const { title, questions } = req.body;
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const quiz = new Quiz({
      title,
      questions,
      createdBy: teacher._id
    });
    await quiz.save();

    teacher.quizzes.push(quiz._id);
    await teacher.save();

    res.status(201).json(quiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// exports.addStudentToClassSection = async (req, res) => {
//   try {
//     const { teacherId, classSectionId, studentId } = req.body;

//     const teacher = await Teacher.findById(teacherId);
//     if (!teacher) {
//       return res.status(404).json({ message: 'Teacher not found' });
//     }

//     const classSection = teacher.classSections.id(classSectionId);
//     if (!classSection) {
//       return res.status(404).json({ message: 'Class section not found' });
//     }

//     classSection.students.push(studentId);

//     await teacher.save();

//     res.status(200).json({ message: 'Student added to class section successfully' });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

exports.addStudentToClassSection = async (req, res) => {
  try {
    const { teacherId, classSectionId, studentId, username, name, class: studentClass, section, age, address, phoneNumber, schoolId } = req.body;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const classSection = teacher.classSections.id(classSectionId);
    if (!classSection) {
      return res.status(404).json({ message: 'Class section not found' });
    }

    const newStudent = new Student({
      username,
      name,
      class: studentClass,
      section,
      age,
      address,
      phoneNumber,
      schoolId
    });

    await newStudent.save();

    classSection.students.push(newStudent._id);
    await teacher.save();

    res.status(200).json(newStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.addClassToTeacher = async (req, res) => {
  const teacherId = req.params.id;
  const { classId } = req.body;

  try {
      // Add teacher to the class
      const updatedClass = await Class.findByIdAndUpdate(
          classId,
          { $addToSet: { teachers: teacherId }, updatedAt: Date.now() },
          { new: true }
      );

      if (!updatedClass) {
          return res.status(404).json({ message: 'Class not found' });
      }

      // Add class to the teacher
      const updatedTeacher = await Teacher.findByIdAndUpdate(
          teacherId,
          { $addToSet: { className: classId }, updatedAt: Date.now() },
          { new: true }
      );

      if (!updatedTeacher) {
          return res.status(404).json({ message: 'Teacher not found' });
      }

      res.status(200).json(updatedTeacher);
  } catch (error) {
      console.error('Error adding class to teacher:', error);
      res.status(500).json({ message: 'Server Error' });
  }
};
