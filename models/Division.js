const mongoose = require('mongoose');


const divisionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  tournamentType: {
    type: String,
  },
  NumberTeams: {
    type: Number,

  },
  ExtraTime: {
    type: Boolean,
  },
  PlayerPerTeam: {
    type: Number,
  },
  MatchDuration: {
    type: Number,
  },
  stages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stage',
    default: [],
  }],
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
  }],
});
const Division = mongoose.model('Division', divisionSchema);
module.exports = Division;





