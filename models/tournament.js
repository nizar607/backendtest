const mongoose = require('mongoose');

// Define tournament schema
const tournamentSchema = new mongoose.Schema({

  tournamentLogo: {
    type: String,
  },
  tournamentName: {
    type: String,
    required: true,
  },
  tournamentLevel: {
    type: String,
    required: true,
  },
  country: {
    type: String,
  },
  tournamentStartDate: {
    type: Date,
  },
  tournamentEndDate: {
    type: Date,
  },
  tournamentSexe: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    required: false,
  },


  divisions: {
    type: [String], // This denotes an array of strings
  },
  status: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isApprouved: {
    type: String,
  },
});

const Tournament = mongoose.model('Tournament', tournamentSchema);
module.exports = Tournament;
