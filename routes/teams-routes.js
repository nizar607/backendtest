const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/AuthenticateUser');
const Team = require('../models/Team');
const Division = require('../models/Division');
const Player = require('../models/player');
const teamPoints = require('../models/TeamPoints');
const Match = require('../models/Match');


router.get('/teams/:divisionId', authenticateUser, async (req, res) => {
    try {
        const divisionId = req.params.divisionId;
        const division = await Division.findById(divisionId);
        if (!division) {
            return res.status(404).json({ error: 'Division not found' });
        }
        const teams = await Team.find({ division: division.name });
        res.status(200).json({ teams });
    } catch (error) {
        console.error('Error getting teams:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/team/:id', authenticateUser, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        res.status(200).json({ team });
    } catch (error) {
        console.error('Error getting team:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

}
);


router.get('/get-team/:id', async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        res.json({ team });
    } catch (error) {
        console.error('Error getting team:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

}
);


router.get('/get-team-with-players/:id', async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        //get players as objects 
        const subtitutes = await Player.find({ _id: { $in: team.subtitutes } });
        team.subtitutes = subtitutes;

        const players = await Player.find({ _id: { $in: team.players } });
        team.players = players;

        res.json({ team });
    } catch (error) {
        console.error('Error getting team:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//get all teams
router.get('/get-teams', async (req, res) => {
    try {
        const teams = await Team.find({});
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des équipes", error: error.message });
    }
});

router.get('/get-teams-with-players', async (req, res) => {
    try {
        const teams = await Team.find({}).populate('players').populate('subtitutes');
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des équipes", error: error.message });
    }
});

router.patch('/update-team/:id', authenticateUser, async (req, res) => {
    try {
        const teamId = req.params.id;
        const updateData = req.body;
        console.log("this is the update data ", updateData);
        await Team.findByIdAndUpdate(teamId, updateData);
        const updatedTeam = await Team.findById(teamId).populate('players').populate('subtitutes');
        return res.json(updatedTeam);
    } catch (error) {
        console.error('Error updating team:', error);
        res.status(500).json({ error: 'Internal server error' })
    }
});

router.get('/allteams', async (req, res) => {
    try {
        const teams = await Team.find().
            populate('players').
            populate('subtitutes');
            res.json(teams);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });


    router.get('/teams-with-points', async (req, res) => {
        try {
            const teamsPointsData = await teamPoints.find();
    
            res.json(teamsPointsData);
        } catch (error) {
            console.error('Error getting teams with points:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/team-with-max-points', async (req, res) => {
        try {
            const teamsPointsData = await teamPoints.find().populate('team');
    
            let maxPoints = 0;
            let teamWithMaxPoints = null;
    
            for (let data of teamsPointsData) {
                const totalPoints = data.points.reduce((a, b) => a + b, 0);
                if (totalPoints > maxPoints) {
                    maxPoints = totalPoints;
                    teamWithMaxPoints = data.team;
                }
            }
    
            if (teamWithMaxPoints) {
                res.json({
                    teamName: teamWithMaxPoints.name,
                    maxPoints: maxPoints
                });
            } else {
                res.status(404).json({ error: 'No teams found' });
            }
        } catch (error) {
            console.error('Error getting team with max points:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/team-stats/:teamId', async (req, res) => {
        try {
            const team = await Team.findById(req.params.teamId).populate('players').populate('subtitutes');
            if (!team) {
                return res.status(404).json({ error: 'Team not found' });
            }
    
            const playerStats = await Promise.all(team.players.map(async player => {
                const playerId = player._id;
                const matchCount = await Match.countDocuments({
                    $or: [
                        { "goals.team1.players": playerId },
                        { "goals.team2.players": playerId },
                        { "cardCounts.team1.yellow.players": playerId },
                        { "cardCounts.team1.red.players": playerId },
                        { "cardCounts.team2.yellow.players": playerId },
                        { "cardCounts.team2.red.players": playerId }
                    ]
                });
    
                const goalsCount = await Match.aggregate([
                    { $match: { $or: [{ "goals.team1.players": playerId }, { "goals.team2.players": playerId }] }},
                    { $group: {
                        _id: null,
                        totalGoals: { $sum: {
                            $add: [
                                { $size: { $filter: { input: "$goals.team1.players", as: "player", cond: { $eq: ["$$player", playerId] } } } },
                                { $size: { $filter: { input: "$goals.team2.players", as: "player", cond: { $eq: ["$$player", playerId] } } } }
                            ]
                        }}
                    }}
                ]);
                
                const cardsCount = await Match.aggregate([
                    { $match: { $or: [
                        { "cardCounts.team1.yellow.players": playerId },
                        { "cardCounts.team1.red.players": playerId },
                        { "cardCounts.team2.yellow.players": playerId },
                        { "cardCounts.team2.red.players": playerId }
                    ]}},
                    { $group: {
                        _id: null,
                        totalYellowCards: { $sum: { $size: { $filter: { input: "$cardCounts.team1.yellow.players", as: "player", cond: { $eq: ["$$player", playerId] } } } }},
                        totalRedCards: { $sum: { $size: { $filter: { input: "$cardCounts.team2.red.players", as: "player", cond: { $eq: ["$$player", playerId] } } } }}
                    }}
                ]);
    
                return {
                    player,
                    matchesPlayed: matchCount,
                    goalsScored: goalsCount[0] ? goalsCount[0].totalGoals : 0,
                    yellowCards: cardsCount[0] ? cardsCount[0].totalYellowCards : 0,
                    redCards: cardsCount[0] ? cardsCount[0].totalRedCards : 0
                };
            }));
    
            res.json({ team, playerStats });
        } catch (error) {
            console.error('Error getting team stats:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

router.get('/team-stats/:teamId', async (req, res) => {
    try {
        const team = await Team.findById(req.params.teamId).populate('players').populate('subtitutes');
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const playerStats = await Promise.all(team.players.map(async player => {
            const playerId = player._id;
            const matchCount = await Match.countDocuments({
                $or: [
                    { "goals.team1.players": playerId },
                    { "goals.team2.players": playerId },
                    { "cardCounts.team1.yellow.players": playerId },
                    { "cardCounts.team1.red.players": playerId },
                    { "cardCounts.team2.yellow.players": playerId },
                    { "cardCounts.team2.red.players": playerId }
                ]
            });

            const goalsCount = await Match.aggregate([
                { $match: { $or: [{ "goals.team1.players": playerId }, { "goals.team2.players": playerId }] } },
                {
                    $group: {
                        _id: null,
                        totalGoals: {
                            $sum: {
                                $add: [
                                    { $size: { $filter: { input: "$goals.team1.players", as: "player", cond: { $eq: ["$$player", playerId] } } } },
                                    { $size: { $filter: { input: "$goals.team2.players", as: "player", cond: { $eq: ["$$player", playerId] } } } }
                                ]
                            }
                        }
                    }
                }
            ]);

            const cardsCount = await Match.aggregate([
                {
                    $match: {
                        $or: [
                            { "cardCounts.team1.yellow.players": playerId },
                            { "cardCounts.team1.red.players": playerId },
                            { "cardCounts.team2.yellow.players": playerId },
                            { "cardCounts.team2.red.players": playerId }
                        ]
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalYellowCards: { $sum: { $size: { $filter: { input: "$cardCounts.team1.yellow.players", as: "player", cond: { $eq: ["$$player", playerId] } } } } },
                        totalRedCards: { $sum: { $size: { $filter: { input: "$cardCounts.team2.red.players", as: "player", cond: { $eq: ["$$player", playerId] } } } } }
                    }
                }
            ]);

            return {
                player,
                matchesPlayed: matchCount,
                goalsScored: goalsCount[0] ? goalsCount[0].totalGoals : 0,
                yellowCards: cardsCount[0] ? cardsCount[0].totalYellowCards : 0,
                redCards: cardsCount[0] ? cardsCount[0].totalRedCards : 0
            };
        }));

        res.json({ team, playerStats });
    } catch (error) {
        console.error('Error getting team stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;