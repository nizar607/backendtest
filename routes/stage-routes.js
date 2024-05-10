const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/AuthenticateUser');
const Stage = require('../models/Stage');
const Division = require('../models/Division');



router.post('/add-stage/:divisionId', authenticateUser, async (req, res) => {

    try {
        const newStage = new Stage(req.body);
        const savedStage = await newStage.save();
        await Division.findByIdAndUpdate(req.params.divisionId, { $push: { stages: savedStage._id } });
        res.status(201).json(savedStage);
    } catch (error) {
        console.error('Error adding stage:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('/get-stages', async (req, res) => {
    try {
        const stages = await Stage.find()
            .populate({
                path: 'groups',
                populate: {
                    path: 'teams',
                    populate: ['players', 'subtitutes']
                }
            });
        return res.json(stages);
    } catch (error) {
        console.error('Error getting stages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



router.get('/get-stage-by-divisionId/:divisionId', async (req, res) => {

    try {
        const stages = await Stage.find({ division: req.params.divisionId })
            .populate({
                path: 'groups',
                populate: {
                    path: 'teams',
                    populate: ['players', 'subtitutes']
                }
            });
        return res.json(stages);
    } catch (error) {
        console.error('Error getting stages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});





module.exports = router;