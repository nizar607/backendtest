const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
    division: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Division',
        required: true,
    },
    number: {
        type: Number,
        required: true,
    },
    finished: {
        type: Boolean,
        required: true,
        default: false,
    },
    groups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
    }]
});


const Stage = mongoose.model('Stage', stageSchema);
module.exports = Stage;