const mongoose = require('mongoose');


const teamsPointsSchema = new mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true,
    },
    division: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Division',
        required: true,
    },
    points: {
        type: [Number],
        default: [],
    },
});
// team points
const TeamPoints = mongoose.model('TeamPoint', teamsPointsSchema);
module.exports = TeamPoints;