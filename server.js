require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const teacherRoutes = require('./routes/TeacherRoutes');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
const Response = require('./models/StudentsResponse');
const Quiz = require('./models/Quiz');
const Teacher = require('./models/Teacher');
const Class = require('./models/Class');
const NewStudent = require('./models/NewStudent');

app.use('/api/teachers', teacherRoutes);
const userRoutes = require('./routes/UserRoutes');
app.use('/api/users', userRoutes);

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
    const questions = await Question.aggregate([{ $sample: { size: 4 } }]);
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


// Fetch classes by ID for students
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

// fetch quiz by id
app.post('/api/quiz/by-ids', async (req, res) => {
  const { quizId } = req.body;

  try {
    const quiz = await Quiz.find({ _id: { $in: quizId } });
    res.status(200).json(quiz);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});


//***************************************************** adding authentication ********************
// app.post('/api/new-student', async (req, res) => {
//   try {
//     const { 
//       username, 
//       name, 
//       classId, 
//       section, 
//       id, 
//       age, 
//       address, 
//       phoneNumber, 
//       teachers, 
//       assignments, 
//       correctquestions, 
//       wrongquestions, 
//       totalquestions, 
//       schoolId, 
//       studentResponse 
//     } = req.body;

//     const newStudent = new NewStudent({ 
//       username, 
//       name, 
//       classId, 
//       section, 
//       id, 
//       age, 
//       address, 
//       phoneNumber, 
//       teachers, 
//       assignments, 
//       correctquestions, 
//       wrongquestions, 
//       totalquestions, 
//       schoolId, 
//       studentResponse 
//     });

//     const savedStudent = await newStudent.save();
//     res.status(201).json(savedStudent);
//   } catch (error) {
//     console.error('Error creating student:', error);
//     if (error.code === 11000) {
//       res.status(400).json({ message: 'Duplicate key error: Username or ID already exists' });
//     } else {
//       res.status(500).json({ message: 'Server Error', error: error.message });
//     }
//   }
// });

app.post('/api/new-student', async (req, res) => {
  try {
    const { 
      username, 
      password, 
      name, 
      classId, 
      section, 
      id, 
      age, 
      address, 
      phoneNumber, 
      teachers, 
      assignments, 
      correctquestions, 
      wrongquestions, 
      totalquestions, 
      schoolId, 
      studentResponse 
    } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = new NewStudent({ 
      username, 
      password: hashedPassword, 
      name, 
      classId, 
      section, 
      id, 
      age, 
      address, 
      phoneNumber, 
      teachers, 
      assignments, 
      correctquestions, 
      wrongquestions, 
      totalquestions, 
      schoolId, 
      studentResponse 
    });

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


//*********************************************adding authentication******************************** */

// to login student with username

app.get('/api/student/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const student = await NewStudent.findOne({ username });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});



app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the student by username
    const student = await NewStudent.findOne({ username });
    if (!student) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Compare the password with the stored hashed password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: student._id }, 'your_jwt_secret', { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error logging in student:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

//************************login studen with jwt***************************

// give it quiz id and it will fetch all questions at the time
app.get('/api/quizzes/:quizId/questions', async (req, res) => {
  const { quizId } = req.params;

  try {
    // Find the quiz by ID
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).send('Quiz not found');
    }

    // Extract question IDs from the quiz
    const questionIds = quiz.questions;

    // Fetch questions by their IDs
    const questions = await Question.find({ _id: { $in: questionIds } });

    res.status(200).json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).send('Server Error');
  }
});








const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const upload = multer({ dest: 'uploads/' });

const apiKey = "AIzaSyDsEvPf8X0M03OkSaDqmyqy1EZubalOg7Y"; // Ensure the API key is set in your environment variables
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
   

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dummrfevq',
  api_key: '186528687344235',
  api_secret: 'PDc8hU4KzMPff3mFrLWTPezK0a4',
});

const runocr = async (imagePath, mimeType, questionstrings) => {
  const prompt = `the image will provide you a  answer of question ${questionstrings} based on ncert bord and you have to judge the answer according to marking patern used by teachers. so at first give summery that the answer provided is correct, could be improved, or wrong or excellent then you have to give response in 3 steps that is first step- it is "correct" or "wrong" or "could be improved" second step- what is good things in answer, third step- what could be improved if it is not a perfect answer written, fourth step- give the perfect answer for that question`;


  const cloudinaryResponse = await cloudinary.uploader.upload(imagePath, {
    folder: 'quizapp',
  });

  const imageUrl = cloudinaryResponse.secure_url;

  // Read image file and encode it to base64
  const imageData = require('fs').readFileSync(imagePath).toString('base64');

  const image = {
    inlineData: {
      data: imageData,
      mimeType: mimeType,
    },
  };

  try {
    const result = await model.generateContent([prompt, image]);
    return { answer: result.response.text(), imageUrl };
  } catch (error) {
    throw new Error(`Error processing image: ${error.message}`);
  }
};

// Endpoint to handle response submission with image upload
app.post('/api/responses', upload.array('images'), async (req, res) => {
  const { studentId, quizId, questionIds, questionstrings, answers} = req.body;
  const files = req.files;

  try {
    // Check if the student and quiz exist
    const student = await NewStudent.findById(studentId);
    const quiz = await Quiz.findById(quizId);
    if (!student || !quiz) {
      return res.status(404).send('Student or Quiz not found');
    }
    
     // Add the quizId to the submitedQuiz array if it doesn't already exist
     if (!student.submitedQuiz.includes(quizId)) {
      student.submitedQuiz.push(quizId);
      await student.save();  // Save the updated student document to the database
    }


    // Process each uploaded image
    const answers = await Promise.all(
      files.map(async (file, index) => {
        const { answer, imageUrl } = await runocr(file.path, file.mimetype, questionstrings[index]);
        return {
          questionId: questionIds[index],
          questionstring: questionstrings[index],
          answer: answer,
          geminiresponse: answer,
          imageUrl: imageUrl,
        };
      })
    );

    // Check if a response already exists for the student
    let response = await Response.findOne({ student: studentId });

    if (response) {
      // If the response exists, add the new quiz to the quizzes array
      response.quizzes.push({
        quiz: quizId,
        answers,
      });
    } else {
      // If the response does not exist, create a new response
      response = new Response({
        student: studentId,
        quizzes: [{
          quiz: quizId,
          answers,
        }],
      });
    }

    // Save the response to the database
    await response.save();
    res.status(201).send('Response saved successfully');
  } catch (error) {
    console.error('Error saving response:', error);
    res.status(500).send('Server Error');
  }
});
//************************************************the api to fetch pending quiz */

app.get('/quizzespending/:studentId', async (req, res) => {
  try {
      const { studentId } = req.params;

      // 1. Fetch the student data using studentId
      const student = await NewStudent.findById(studentId)
          .populate('submitedQuiz', '_id') // Populate submitedQuiz to get quiz IDs
          .populate('classId', 'quizId')   // Populate classId to get the class and its quiz IDs
          .exec();

      if (!student) {
          return res.status(404).json({ error: 'Student not found' });
      }

      // 2. Get the classId and the submitedQuiz array from the student
      const { classId, submitedQuiz } = student;
      const submitedQuizIds = submitedQuiz.map(quiz => quiz._id);

      // 3. Fetch the class data using classId to get the quizId array
      const classData = await Class.findById(classId)
          .populate('quizId', '_id') // Populate quizId to get quiz IDs
          .exec();

      if (!classData) {
          return res.status(404).json({ error: 'Class not found' });
      }

      const classQuizIds = classData.quizId.map(quiz => quiz._id);

      // 4. Find the difference between classQuizIds and submitedQuizIds
      const unsubmittedQuizIds = classQuizIds.filter(quizId =>
          !submitedQuizIds.includes(quizId.toString())
      );

      // 5. Fetch the quiz details using the unsubmittedQuizIds
      const unsubmittedQuizzes = await Quiz.find({ _id: { $in: unsubmittedQuizIds } });

      // 6. Return the quizzes to the frontend
      res.status(200).json(unsubmittedQuizzes);

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
  }
});

//*************************************************api to fetch pending quiz */


app.get('/api/responses/student/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
    const responses = await Response.find({ student: studentId })
      .populate('quizzes.quiz')
      .populate('quizzes.answers.questionId');
    res.status(200).json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).send('Server Error');
  }
});






const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});