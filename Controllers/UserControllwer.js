const User = require('../models/User');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { firstName, lastName, email, schoolName, className, board, username, password, category } = req.body;
  try {
    const user = new User({ firstName, lastName, email, schoolName, className, board, username, password , category});
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

}
  const login = async (req, res) => {
   const { username, password } = req.body;
   try {
     const user = await User.findOne({ username });
     if (!user) {
       return res.status(404).json({ error: 'User not found' });
     }
     const isMatch = await user.comparePassword(password);
 
     if (!isMatch) {
       return res.status(400).json({ error: 'Invalid credentials' });
     }
     const token = jwt.sign({ id: user._id, category: user.category }, 'your_jwt_secret', { expiresIn: '1h' });
     res.json({ token, category: user.category });
   } catch (error) {
     res.status(500).json({ error: error.message });
   }
 };
 

const verifyToken = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = { register, login, verifyToken };
