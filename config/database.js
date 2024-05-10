const mongoose = require('mongoose');

async function connectToDatabase() {
    try {
        //await mongoose.connect('mongodb://127.0.0.1:27017/validation', {
        // await mongoose.connect('mongodb://127.0.0.1:27017/validationCopy2', {
        //await mongoose.connect('mongodb://127.0.0.1:27017/validationCopy', {
        //await mongoose.connect('mongodb://127.0.0.1:27017/finalTest', {
        //await mongoose.connect('mongodb://127.0.0.1:27017/MS-User', {
        //await mongoose.connect('mongodb://127.0.0.1:27017/validation-finale', {
        await mongoose.connect('mongodb+srv://admin:admin@fiddod.xnchtzy.mongodb.net/?retryWrites=true&w=majority&appName=fiddod', {

            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to db successfully...');
    } catch (error) {
        console.error('Error connecting to db:', error);
    }
}

module.exports = connectToDatabase;



















// await mongoose.connect('mongodb://127.0.0.1:27017/MS-User', {
// await mongoose.connect('mongodb://127.0.0.1:27017/test1', {
// await mongoose.connect('mongodb://127.0.0.1:27017/test2', {
// await mongoose.connect('mongodb://127.0.0.1:27017/test5', {
// await mongoose.connect('mongodb://127.0.0.1:27017/test10', {
// await mongoose.connect('mongodb://127.0.0.1:27017/arslen', {