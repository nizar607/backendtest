const mongoose = require('mongoose');

// Define tournament schema
const playerSchema = new mongoose.Schema({

  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  avatar: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  country: {
    type: String,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },

  playerNumber: {
    type: Number,
    required: true,
  },
  position: {
    type: Number,
    required: true,
  },
});

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;
