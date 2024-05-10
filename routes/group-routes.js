const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/AuthenticateUser');
const Group = require('../models/Group');
const Division = require('../models/Division');
const Stage = require('../models/Stage');
const Match = require('../models/Match');



router.post('/add-group/:stageId', authenticateUser, async (req, res) => {

    try {
        const stage = await Stage.findById(req.params.stageId);
        const newGroup = new Group(req.body);
        const savedGroup = await newGroup.save();

        if (stage.number == 0) {
            const matches = [];
            for (let i = 0; i < savedGroup.teams.length; i++) {
                for (let j = i + 1; j < savedGroup.teams.length; j++) {
                    const match = new Match({
                        team1: savedGroup.teams[i],
                        team2: savedGroup.teams[j],
                        division: stage.division,
                    });
                    matches.push(match);
                }
            }
            const addedMatches = await Match.insertMany(matches);
            savedGroup.matches = addedMatches.map(match => match._id);
            await savedGroup.save();
        }

        await Stage.findByIdAndUpdate(req.params.stageId, { $push: { groups: savedGroup._id } });
        res.status(201).json({ savedGroup });
    } catch (error) {
        console.error('Error adding group:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



router.get('/get-groups', async (req, res) => {
    try {
        const groups = await Group.find()
            .populate({
                path: 'teams',
                populate: ['players', 'subtitutes']
            });
        res.json(groups);
    } catch (error) {
        console.error('Error getting group:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



router.get('/get-group-by-stageId/:stageId', async (req, res) => {

    try {
        const groups = await Group.find({ stage: req.params.stageId })
            .populate({
                path: 'teams',
                populate: ['players', 'subtitutes']
            });
        return res.json(groups);
    } catch (error) {
        console.error('Error getting groups:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});





module.exports = router;