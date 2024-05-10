const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    logo: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    division: {
        type: String,
        required: true,
    },
    players: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
        // validate: [playersLimit, '{PATH} exceeds the limit of 11']
    },
    subtitutes: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Player' }]
    }
});

function playersLimit(val) {
    return val.length <= 11;
}


const Team = mongoose.model('Team', teamSchema);
module.exports = Team;