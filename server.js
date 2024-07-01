require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

mongoose.connect(process.env.MONGODB_URI, {
 
});

app.use(cors());
app.use(express.json());

const Question = require('./models/Question');
const History = require('./models/History');
const User = require('./models/User');

app.post('/api/questions', async (req, res) => {
  const { question, options, correctOption } = req.body;
  const newQuestion = new Question({ question, options, correctOption });
  await newQuestion.save();
  res.status(201).send(newQuestion);
});

app.get('/api/questions', async (req, res) => {
  const questions = await Question.aggregate([{ $sample: { size: 2 } }]);
  res.send(questions);
});

app.post('/api/submit', async (req, res) => {
  const { username, answers } = req.body;
  let user = await User.findOne({ username });
  if (!user) {
    user = new User({ username });
    await user.save();
  }

  const newHistory = new History({ username, answers });
  await newHistory.save();

  res.status(201).send(newHistory);
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
