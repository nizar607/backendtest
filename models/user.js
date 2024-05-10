const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
      type: String,
      required: true,
    },
    first_name: {
      type: String,
      required: false,
    },
    last_name: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    match: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: false
    }],
  });
    
  
  const User = mongoose.model('User', userSchema);
  module.exports = User;
  