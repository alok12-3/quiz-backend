const mongoose = require('mongoose');

const boardClassSubjectChapterMap = {
  ncert: {
    '9': {
      subjects: ['maths', 'science', 'social science'],
      chapters: {
        maths: [
          'Number Systems', 'Polynomials', 'Coordinate Geometry', 'Linear Equations in Two Variables', 
          'Introduction to Euclid’s Geometry', 'Lines and Angles', 'Triangles', 'Quadrilaterals', 
          'Areas of Parallelograms and Triangles', 'Circles', 'Constructions', 'Heron’s Formula', 
          'Surface Areas and Volumes', 'Statistics', 'Probability'
        ],
        science: [
          'Matter in Our Surroundings', 'Is Matter Around Us Pure', 'Atoms and Molecules', 
          'Structure of the Atom', 'The Fundamental Unit of Life', 'Tissues', 'Diversity in Living Organisms', 
          'Motion', 'Force and Laws of Motion', 'Gravitation', 'Work and Energy', 'Sound', 
          'Why Do We Fall Ill?', 'Natural Resources', 'Improvement in Food Resources'
        ],
        social_science: [
          'The French Revolution', 'Socialism in Europe and the Russian Revolution', 'Nazism and the Rise of Hitler', 
          'Forest Society and Colonialism', 'Pastoralists in the Modern World'
        ]
      }
    },
    '10': {
      subjects: ['maths', 'science', 'social science'],
      chapters: {
        maths: [
          'Real Numbers', 'Polynomials', 'Pair of Linear Equations in Two Variables', 'Quadratic Equations', 
          'Arithmetic Progressions', 'Triangles', 'Coordinate Geometry', 'Introduction to Trigonometry', 
          'Applications of Trigonometry', 'Circles', 'Constructions', 'Areas Related to Circles', 
          'Surface Areas and Volumes', 'Statistics', 'Probability'
        ],
        science: [
          'Chemical Reactions and Equations', 'Acids, Bases, and Salts', 'Metals and Non-metals', 
          'Carbon and its Compounds', 'Periodic Classification of Elements', 'Life Processes', 
          'Control and Coordination', 'How do Organisms Reproduce?', 'Heredity and Evolution', 
          'Light: Reflection and Refraction', 'Human Eye and Colourful World', 'Electricity', 
          'Magnetic Effects of Electric Current', 'Sources of Energy', 'Our Environment', 
          'Management of Natural Resources'
        ],
        social_science: [
          'The Rise of Nationalism in Europe', 'The Nationalist Movement in Indo-China', 'Nationalism in India', 
          'The Making of a Global World', 'The Age of Industrialisation', 'Work, Life and Leisure', 
          'Print Culture and the Modern World', 'Novels, Society and History'
        ]
      }
    }
  },
  icse: {
    '9': {
      subjects: ['maths', 'science', 'social science'],
      chapters: {
        maths: [
          'Rational and Irrational Numbers', 'Compound Interest', 'Expansions', 'Factorization', 
          'Simultaneous Linear Equations', 'Indices', 'Logarithms', 'Triangle and its Properties', 
          'Mid-point Theorem', 'Pythagoras Theorem', 'Rectilinear Figures', 'Theorem of Areas', 
          'Coordinate Geometry', 'Mensuration', 'Trigonometry', 'Statistics'
        ],
        science: [
          'Plant and Animal Physiology', 'Diversity in Living Organisms', 'Human Anatomy and Physiology', 
          'Health and Hygiene', 'Nutrition in Plants and Animals', 'Ecology and Ecosystem', 
          'Acids, Bases, and Salts', 'Atoms and Molecules', 'Structure of the Atom', 
          'Chemical Reactions', 'Motion and Measurement', 'Force and Pressure', 
          'Work, Energy, and Power', 'Sound', 'Light'
        ],
        social_science: [
          'The Harappan Civilization', 'The Vedic Period', 'Jainism and Buddhism', 'The Mauryan Empire', 
          'The Gupta Empire', 'The Sangam Age', 'Medieval India', 'The Mughal Empire', 
          'The Maratha Empire', 'Modern India'
        ]
      }
    },
    '10': {
      subjects: ['maths', 'science', 'social science'],
      chapters: {
        maths: [
          'Goods and Services Tax', 'Banking', 'Linear Inequations', 'Quadratic Equations', 
          'Ratio and Proportion', 'Matrices', 'Arithmetic Progression', 'Geometric Progression', 
          'Mensuration', 'Trigonometry', 'Coordinate Geometry', 'Statistics', 'Probability'
        ],
        science: [
          'Chemical Substances - Nature and Behaviour', 'World of Living', 'Natural Phenomena', 
          'Effects of Current', 'Natural Resources'
        ],
        social_science: [
          'The First War of Independence', 'Growth of Nationalism', 'First Phase of the Indian National Movement', 
          'Second Phase of the Indian National Movement', 'The First World War and the Russian Revolution', 
          'The Second World War', 'Post-War World and India'
        ]
      }
    }
  }
};

const questionSchema = new mongoose.Schema({
  board: { type: String, required: true, enum: ['ncert', 'icse'] },
  class: { type: String, required: true, enum: ['9', '10'] },
  subject: { type: String, required: true },
  chapter: { type: String, required: true },
  topic: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['mcq', 'short answer', 'long answer', 'medium answer', 'very long answer', 'fill', 'match'],
    required: true
  },
  question: { type: String, required: true },
  options: [String],
  correctOption: String,
  answerOfQuestion: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Custom validation for chapters
questionSchema.path('chapter').validate(function(value) {
  const { board, class: selectedClass, subject } = this;
  const subjectsForBoard = boardClassSubjectChapterMap[board][selectedClass]?.subjects || [];
  const chaptersForSubject = boardClassSubjectChapterMap[board][selectedClass]?.chapters[subject] || [];

  return subjectsForBoard.includes(subject) && chaptersForSubject.includes(value);
}, 'Invalid chapter for the selected board, class, and subject');

module.exports = mongoose.model('Question', questionSchema);
