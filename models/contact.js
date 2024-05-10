const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    email: {
        type: String,
        required: false,
    },
    name: {
        type: String,
        required: false,
    },

    message: {
        type: String,
        required: false,
    },
    subject: {
        type: String,
        required: false,
    },
    phone: {
        type: Number,
    },

});


const Contact = mongoose.model('Contact', contactSchema);
module.exports = Contact;