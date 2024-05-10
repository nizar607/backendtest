const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/AuthenticateUser');
const TeamPoints = require('../models/TeamPoints');




router.get('/get-teams-points', async (req, res) => {
    try {
        const teamPoints = await TeamPoints.find()
            .populate({
                path: 'team'
            });
        return res.json(teamPoints);
    } catch (error) {
        console.error('Error getting teamPoints:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/top-teams', async (req, res) => {
    try {
        const result = await TeamPoints.aggregate([
            { $unwind: "$points" },
            { $group: { _id: "$team", totalPoints: { $sum: "$points" } } },
            { $sort: { totalPoints: -1 } },
            { $limit: 3 },
            {
                $lookup: {
                    from: "teams",  // Replace with the name of your teams collection
                    localField: "_id",
                    foreignField: "_id",
                    as: "team"
                }
            },
            { $unwind: "$team" }  // Flatten the team array
        ]);

        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/get-points-teams', async (req, res) => {
    try {
        const teamsIds = req.body.teamsIds;
        const teamPoints = await TeamPoints.find({ team: { $in: teamsIds } })
            .populate({
                path: 'team'
            });
        return res.json(teamPoints);
    } catch (error) {
        console.error('Error getting teamPoints:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});






module.exports = router;