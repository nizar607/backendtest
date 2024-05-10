const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    team1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null,
        // required: true,
    },
    team2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null,
        // required: true,
    },
    division: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Division',
        required: true,
    },
    time: {
        type: Date,
        // required: true,
    },
    goals: {
        team1: {
            players: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Player',
                default: [],
            }],
        },
        team2: {
            players: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Player',
                default: [],
            }],
        },
    },
    cardCounts: {
        team1: {
            yellow: {
                players: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Player',
                    default: [],
                }],
            },
            red: {
                players: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Player',
                    default: [],
                }],
            },
        },
        team2: {
            yellow: {
                players: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Player',
                    default: [],
                }],
            },
            red: {
                players: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Player',
                    default: [],
                }],
            },
        },
    },
    status: {
        type: String,
        required: true,
        enum: ['En cours', 'Terminé', 'Non joué'],
        default: 'Non joué',
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null,
    },
    loser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null,
    },
    draw: {
        type: Boolean,
        default: false,
    },
    events: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: [],
    }],
    nextMatchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
    },
    round: {
        type: Number,
    },
    stats: {
        type: Object,
        required: false
    },
});


matchSchema.statics.updateMatchScore = async function (matchId, scoreTeam1, scoreTeam2) {
    try {
        const updatedMatch = await this.findByIdAndUpdate(matchId, {
            $set: {
                scoreTeam1: scoreTeam1,
                scoreTeam2: scoreTeam2
            }
        }, { new: true });

        if (!updatedMatch) {
            throw new Error('Match not found');
        }

        return updatedMatch;
    } catch (error) {
        throw new Error(`Failed to update match score: ${error.message}`);
    }
};



matchSchema.statics.updateMatchStatus = async function (matchId, newStatus) {
    try {
        const updatedMatch = await this.findByIdAndUpdate(matchId, {
            $set: {
                status: newStatus
            }
        }, { new: true }).populate('team1', 'name logo')
            .populate('team2', 'name logo')
            .populate('division', 'name');

        if (!updatedMatch) {
            throw new Error('Match not found');
        }

        return updatedMatch;
    } catch (error) {
        throw new Error(`Failed to update match status: ${error.message}`);
    }
};







const Match = mongoose.model('Match', matchSchema);
module.exports = Match;



/*const mongo = require('mongoose');
const matchSchema = new mongo.Schema({
    team1: {
        type: String,
        required: true,
    },
    team2: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    time: {
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
    result: {
        type: String,
        required: true,
    },
    score1: {
        type: Number,
        required: true,
    },
    score2: {
        type: Number,
        required: true,
    },
});*/