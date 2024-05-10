const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    teams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true,
    }],
    matches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true,
        default: [],
    }],
    stage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stage',
        required: true,
    }
});


const Group = mongoose.model('Group', groupSchema);
module.exports = Group;