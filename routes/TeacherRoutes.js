const express = require('express');
const router = express.Router();
const {
  createTeacher,
  getTeacher,
  getClassSections,
  getBookmarkedQuestions,
  getQuizzes,
  getQuestionDetails,
  addClassSection,
  bookmarkQuestion,
  createQuiz,
  addStudentToClassSection // Ensure this function is correctly imported
} = require('../Controllers/TeacherController');

router.post('/', createTeacher);
router.get('/username/:username', getTeacher);
router.get('/:id/class-sections', getClassSections);
router.get('/:id/bookmarked-questions', getBookmarkedQuestions);
router.get('/:id/quizzes', getQuizzes);
router.get('/question/:questionId', getQuestionDetails);
router.post('/:id/class-section', addClassSection);
router.post('/:id/bookmark-question', bookmarkQuestion);
router.post('/:id/create-quiz', createQuiz);
router.post('username/students', addStudentToClassSection);

module.exports = router;
