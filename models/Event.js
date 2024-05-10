const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        default: '',
    },
    match: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true,
    },
    player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: false,
    },
    substitute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: false
    },
    score: {
        type: Object,
        required: false
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    imageEvent :{
        type: String,
        required: false
    }
});


//event model
const Event = mongoose.model('Event', eventSchema);
module.exports = Event;