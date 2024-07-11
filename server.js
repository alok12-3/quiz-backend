require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const teacherRoutes = require('./routes/TeacherRoutes');

const app = express();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error(err));

app.use(cors());
app.use(express.json());

const Question = require('./models/Question');
const History = require('./models/History');
const User = require('./models/User');

const Quiz = require('./models/Quiz');
const Teacher = require('./models/Teacher');
const Class = require('./models/Class');
const NewStudent = require('./models/NewStudent');

app.use('/api/teachers', teacherRoutes);



app.post('/api/questions', async (req, res) => {
  try {
    const { question, options, correctOption, answerOfQuestion, board, class: selectedClass, subject, chapter, topic, questionType, difficulty } = req.body;

    if (questionType === 'mcq') {
      if (!options || options.length === 0 || !correctOption) {
        return res.status(400).send("Options and correct option are required for MCQ questions");
      }
    } else {
      if (!answerOfQuestion) {
        return res.status(400).send("Answer of question is required for non-MCQ questions");
      }
    }

    const newQuestion = new Question({ 
      question, 
      options: questionType === 'mcq' ? options : undefined,
      correctOption: questionType === 'mcq' ? correctOption : undefined,
      answerOfQuestion: questionType !== 'mcq' ? answerOfQuestion : undefined,
      board,
      class: selectedClass,
      subject,
      chapter,
      topic,
      questionType,
      difficulty
    });

    await newQuestion.save();
    res.status(201).send(newQuestion);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.get('/api/questions', async (req, res) => {
  try {
    const questions = await Question.aggregate([{ $sample: { size: 2 } }]);
    res.send(questions);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.post('/api/submit', async (req, res) => {
  try {
    const { username, answers } = req.body;
    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username });
      await user.save();
    }

    const newHistory = new History({ username, answers });
    await newHistory.save();

    res.status(201).send(newHistory);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.get('/api/history/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const historyEntries = await History.find({ username }).populate('answers.questionId');

    const response = await Promise.all(
      historyEntries.map(async (entry) => {
        const answers = await Promise.all(
          entry.answers.map(async (answer) => {
            const question = await Question.findById(answer.questionId);
            return {
              question: question.question,
              selectedOption: answer.selectedOption,
              correctOption: answer.correctOption
            };
          })
        );
        return { answers };
      })
    );

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});



// Create a class
app.post('/api/schools', async (req, res) => {
  const { className, year, grade, section, schoolId } = req.body;
  try {
      const newClass = new Class({
          className,
          year,
          grade,
          section,
          schoolId
      });
      const savedClass = await newClass.save();
      res.status(201).json(savedClass);
  } catch (error) {
      console.error('Error creating class:', error);
      res.status(500).json({ message: 'Server Error' });
  }
});

// API to fetch all classes
app.get('/api/classes', async (req, res) => {
  try {
    const classes = await Class.find();
    res.status(200).json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update classes by adding teacher ID
app.put('/api/classes/add-teacher', async (req, res) => {
  const { teacherId, classIds } = req.body;
  try {
    const updateResult = await Class.updateMany(
      { _id: { $in: classIds } },
      { $addToSet: { teachers: teacherId } }
    );
    res.status(200).json(updateResult);
  } catch (error) {
    console.error('Error updating classes:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});



// Add teacher to classes and classes to teacher
app.post('/api/teachers/:teacherId/classes', async (req, res) => {
  const { teacherId } = req.params;
  const { classIds } = req.body;

  try {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).send("Teacher not found");
    }

    // Update teacher's classes using $addToSet to ensure uniqueness
    await Teacher.updateOne(
      { _id: teacherId },
      { $addToSet: { className: { $each: classIds } } }
    );

    // Update each class with the teacher's ID using $addToSet to ensure uniqueness
    await Class.updateMany(
      { _id: { $in: classIds } },
      { $addToSet: { teachers: teacherId } }
    );

    res.status(200).send("Classes updated successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});


// Fetch classes by IDs
app.post('/api/classes/by-ids', async (req, res) => {
  const { classIds } = req.body;

  try {
    const classes = await Class.find({ _id: { $in: classIds } });
    res.status(200).json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});



app.post('/api/classes/:classId/add-quiz', async (req, res) => {
  const { classId } = req.params;
  const { quizId } = req.body;

  try {
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).send("Class not found");
    }

    // Add the quiz ID to the class using $addToSet to avoid duplicates
    await Class.updateOne(
      { _id: classId },
      { $addToSet: { quizId: quizId } }  // Ensure this matches the field name in the database
    );

    res.status(200).send("Quiz assigned to class successfully");
  } catch (error) {
    console.error('Error assigning quiz:', error.stack);
    res.status(500).send("Server Error");
  }
});



// Fetch all quizzes
app.get('/api/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.status(200).json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});


//   ************************STUDENTS API******************************//

app.post('/api/new-student', async (req, res) => {
  try {
    const { username, name, class: studentClass, section, id, age, address, phoneNumber, teachers, assignments, correctquestions, wrongquestions, totalquestions, schoolId, studentResponse } = req.body;
    const newStudent = new NewStudent({ username, name, class: studentClass, section, id, age, address, phoneNumber, teachers, assignments, correctquestions, wrongquestions, totalquestions, schoolId, studentResponse });
    const savedStudent = await newStudent.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Duplicate key error: Username or ID already exists' });
    } else {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});









