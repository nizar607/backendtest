const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authenticateUser = async (req, res, next) => {
    try {
        // Check if the Authorization header is present
            if (!req.headers.authorization) {
        return res.status(401).json({ error: 'No authorization header' });
      }
      


      // Get the token from the Authorization header
      const token = req.headers.authorization.split(' ')[1];
   
      // Verify the token
      const decoded = jwt.verify(token, 'your-secret-key'); // replace 'your_jwt_secret' with your actual secret
  
      // Find the user by id
      const user = await User.findById(decoded.userId);
  
      if (!user) {
        return res.status(401).json({ error: 'Authentication failed' });
      }
  
      // Set req.user to the authenticated user
      req.user = user;
  
      
      // Call the next middleware function
      next();
    } catch (error) {
      console.error('Error authenticating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  module.exports = authenticateUser;