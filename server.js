require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
