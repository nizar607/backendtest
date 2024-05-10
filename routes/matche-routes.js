const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/AuthenticateUser');
const Match = require('../models/Match');
const Division = require('../models/Division');
const Player = require('../models/player');
const TeamPoints = require('../models/TeamPoints');
const Event = require('../models/Event');
const Tournament = require('../models/tournament');
const Team = require('../models/Team');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    },
});


const upload = multer({ storage: storage });


router.post('/addMatches', authenticateUser, async (req, res) => {
    const matches = req.body.matches;
    let savedMatches = [];

    try {
        // Initial round number
        let roundNumber = 1;

        // Save the initial matches to get their IDs, assign them to the first round
        for (let match of matches) {
            const newMatch = new Match({
                ...match,
                round: roundNumber, // Add round information
            });
            const savedMatch = await newMatch.save();
            savedMatches.push(savedMatch);
        }

        // Increment the round number for the next set of matches
        roundNumber++;

        // While there are still matches to process
        while (savedMatches.length > 1) {
            let nextRoundMatches = [];

            // Process matches in pairs
            for (let i = 0; i < savedMatches.length; i += 2) {
                // Create a match for the next round
                const nextMatch = new Match({
                    team1: null,
                    team2: null,
                    division: savedMatches[i].division,
                    time: null,
                    round: roundNumber, // Set the round number for this match
                });

                const savedNextMatch = await nextMatch.save();

                // Set nextMatchId for match1 and match2
                await Match.findByIdAndUpdate(savedMatches[i]._id, { $set: { nextMatchId: savedNextMatch._id } });
                await Match.findByIdAndUpdate(savedMatches[i + 1]._id, { $set: { nextMatchId: savedNextMatch._id } });

                // Add the next match to the nextRoundMatches array
                nextRoundMatches.push(savedNextMatch);
            }

            // Prepare for the next round if necessary
            savedMatches = nextRoundMatches;
            roundNumber++; // Increment the round number for the next set of matches
        }

        // Optionally, update the division status after creating the tournament structure
        await Division.findByIdAndUpdate(matches[0].division, { status: 'completed' });


        // Assuming you know the tournament ID. If not, you may need to adjust how you obtain it.
        const tournamentId = matches[0].tournament;

        // Fetch all divisions for the tournament
        const divisions = await Division.find({ tournament: tournamentId });

        // Check if all divisions are completed
        const allDivisionsCompleted = divisions.every(division => division.status === 'completed');

        // If all divisions are completed, update the tournament's status
        if (allDivisionsCompleted) {
            await Tournament.findByIdAndUpdate(tournamentId, { status: 'Completed' });
        }

        res.status(201).json({ savedMatches });
    } catch (error) {
        console.error('Error adding matches:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.post('/add-matches/:divisionId', authenticateUser, async (req, res) => {
    const matches = req.body;

    let savedMatches = [];

    try {
        const division = await Division.findById(req.params.divisionId);
        console.log("matches here ", matches);
        const addedMatches = Match.insertMany(matches);


        if (division.tournamentType == "mixed") {
        }

        if (division.tournamentType == "championship") {
            await Division.findByIdAndUpdate(division, { status: 'completed' });
        }


        res.status(201).json({ savedMatches });
    } catch (error) {
        console.error('Error adding matches:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/getMatches/:divisionId', async (req, res) => {
    try {
        const matches = await Match.find({ division: req.params.divisionId })
            .populate('team1')
            .populate('team2');

        res.status(200).json({ matches });
    } catch (error) {
        console.error('Error getting matches:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('/matches', async (req, res) => {
    try {
        const matches = await Match.find()
            .populate('team1')
            .populate('team2')
            .populate('division', 'name');
        const formattedMatches = matches.map(match => ({
            _id: match._id,
            team1Name: match.team1 ? match.team1.name : 'Team 1 not found',
            team1Logo: match.team1 ? match.team1.logo : 'Logo 1 not found',
            team2Name: match.team2 ? match.team2.name : 'Team 2 not found',
            team2Logo: match.team2 ? match.team2.logo : 'Logo 2 not found',
            divisionName: match.division ? match.division.name : 'Division not found',
            time: match.time,

            scoreTeam1: match.scoreTeam1,
            scoreTeam2: match.scoreTeam2,
            matchStatus: match.status,
            cardCounts: match.cardCounts
        }));

        res.json(formattedMatches);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});



router.patch('/patch-match/:id', authenticateUser, async (req, res) => {
    try {
        const updatedMatch = await Match.findById(req.params.id);
        if (!updatedMatch) {
            throw new Error('Match not found');
        }
        updatedMatch.time = req.body.time;
        const result = await updatedMatch.save();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error updating match:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/*
router.put('/tournament/:id', authenticateUser, upload.single('tournamentLogo'), async (req, res) => {
  try {
    const tournamentId = req.params.id;
    let updateData = req.body;

    if (Object.keys(updateData.tournamentLogo || {}).length === 0) {
      delete updateData.tournamentLogo;
    }


    if (req.file && req.file.path) {
      updateData.tournamentLogo = req.file.path;
    }

    const updatedTournament = await Tournament.findByIdAndUpdate(tournamentId, updateData, { new: true });

    if (!updatedTournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.status(200).json(updatedTournament);
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
*/

router.patch('/update-stats/:id', authenticateUser, async (req, res) => {
    try {
        const updatedMatch = await Match.findById(req.params.id);
        if (!updatedMatch) {
            throw new Error('Match not found');
        }
        updatedMatch.stats = req.body.stats;
        const result = await updatedMatch.save();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error updating match:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/update-event-image/:id', authenticateUser, upload.single('imageEvent'), async (req, res) => {
    try {
        const updatedMatch = await Match.findById(req.params.id);
        if (!updatedMatch) {
            throw new Error('Match not found');
        }
        let updateData = req.body;

        if (Object.keys(updateData.imageEvent || {}).length === 0) {
            delete updateData.imageEvent;
        }

        const newEvent = new Event({
            action: 'imageEvent',
            match: updatedMatch._id,
            imageEvent: req.file.path
        });

        /*
        if (req.file && req.file.path) {
            newEvent
                ;
        }
        */


        const addedEvent = await newEvent.save();


        updatedMatch.events.push(addedEvent._id);
        const result = await updatedMatch.save();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error updating match:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/update-match-score/:idMatch/:idPlayer', async (req, res) => {
    try {
        const match = await Match.findById(req.params.idMatch)
            .populate('team1')
            .populate('team2')
            .populate('events');

        const player = await Player.findById(req.params.idPlayer);

        if (!match || !player) {
            throw new Error('Match or player not found');
        }

        if (match.team1.players.includes(player._id)) {
            match.goals.team1.players.push(player._id);
        } else {
            match.goals.team2.players.push(player._id);
        }

        const newEvent = new Event({
            action: 'goal',
            player: player._id,
            match: match._id,
            score: {
                team1: match.goals.team1.players.length,
                team2: match.goals.team2.players.length
            }
        });
        const addedEvent = await newEvent.save();
        match.events.push(addedEvent._id);


        const updatedMatch = await match.save();
        res.status(200).json(updatedMatch);

    } catch (error) {
        console.error('Error updating match score:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
);

router.patch('/update-match-red-card/:idMatch/:idPlayer', async (req, res) => {
    try {
        const match = await Match.findById(req.params.idMatch)
            .populate('team1')
            .populate('team2')
            .populate('events');

        const player = await Player.findById(req.params.idPlayer);

        if (!match || !player) {
            throw new Error('Match or player not found');
        }

        if (match.team1.players.includes(player._id)) {
            match.cardCounts.team1.red.players.push(player._id);
            //     team1: {
            //         yellow: {
            //             players: [{
            //                 type: mongoose.Schema.Types.ObjectId,
            //                 ref: 'Player',
            //                 default: [],
            //             }],
            //         },
            //         red: {
            //             players: [{
            //                 type: mongoose.Schema.Types.ObjectId,
            //                 ref: 'Player',
            //                 default: [],
            //             }],
            //         },
            //     },
            //     team2: {
            //         yellow: {
            //             players: [{
            //                 type: mongoose.Schema.Types.ObjectId,
            //                 ref: 'Player',
            //                 default: [],
            //             }],
            //         },
            //         red: {
            //             players: [{
            //                 type: mongoose.Schema.Types.ObjectId,
            //                 ref: 'Player',
            //                 default: [],
            //             }],
            //         },
            //     },
            // },
        } else {
            match.cardCounts.team2.red.players.push(player._id);
        }

        const newEvent = new Event({
            action: 'red',
            player: player._id,
            match: match._id,
        });

        const addedEvent = await newEvent.save();
        match.events.push(addedEvent._id);

        const updatedMatch = await match.save();
        res.status(200).json(updatedMatch);

    } catch (error) {
        console.error('Error updating match card:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
);
router.patch('/update-match-corners/:idMatch/:idPlayer', async (req, res) => {
    try {
        const match = await Match.findById(req.params.idMatch)
            .populate('team1')
            .populate('team2')
            .populate('events');

        const player = await Player.findById(req.params.idPlayer);

        if (!match || !player) {
            throw new Error('Match or player not found');
        }



        const newEvent = new Event({
            action: 'corner',
            player: player._id,
            match: match._id,
        });

        const addedEvent = await newEvent.save();
        match.events.push(addedEvent._id);

        const updatedMatch = await match.save();
        res.status(200).json(updatedMatch);

    } catch (error) {
        console.error('Error updating match card:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
);

router.patch('/update-match-shot-on-target/:idMatch/:idPlayer', async (req, res) => {
    try {
        const match = await Match.findById(req.params.idMatch)
            .populate('team1')
            .populate('team2')
            .populate('events');

        const player = await Player.findById(req.params.idPlayer);

        if (!match || !player) {
            throw new Error('Match or player not found');
        }



        const newEvent = new Event({
            action: 'shot-on-target',
            player: player._id,
            match: match._id,
        });

        const addedEvent = await newEvent.save();
        match.events.push(addedEvent._id);

        const updatedMatch = await match.save();
        res.status(200).json(updatedMatch);

    } catch (error) {
        console.error('Error updating match card:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
);

router.patch('/update-match-substitutes/:idMatch/:idTeam/:idPlayer/:idSubstitute', async (req, res) => {
    try {
        const match = await Match.findById(req.params.idMatch)
            .populate('events');


        const team = await Team.findById(req.params.idTeam);
        const player = await Player.findById(req.params.idPlayer);
        const substitute = await Player.findById(req.params.idSubstitute);

        substitute.position = player.position;

        await substitute.save();

        if (!match || !player || !substitute) {
            throw new Error('Match or player not found');
        }


        team.players = team.players.filter(p => p.toString() !== player._id.toString());
        team.subtitutes.push(player._id);

        team.subtitutes = team.subtitutes.filter(p => p.toString() !== substitute._id.toString());
        team.players.push(substitute._id);



        const updatedTeam = await team.save();

        const newEvent = new Event({
            action: 'substitution',
            player: player._id,
            substitute: substitute._id,
            match: match._id,
        });

        const addedEvent = await newEvent.save();
        match.events.push(addedEvent._id);

        const updatedMatch = await match.save();
        res.status(200).json(updatedMatch);
    } catch (error) {
        console.error('Error updating match card:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
);

router.patch('/update-match-yellow-card/:idMatch/:idPlayer', async (req, res) => {
    try {
        const match = await Match.findById(req.params.idMatch)
            .populate('team1')
            .populate('team2')
            .populate('events');

        const player = await Player.findById(req.params.idPlayer);

        if (!match || !player) {
            throw new Error('Match or player not found');
        }

        if (match.team1.players.includes(player._id)) {
            match.cardCounts.team1.yellow.players.push(player._id);
        } else {
            match.cardCounts.team2.yellow.players.push(player._id);
        }

        const newEvent = new Event({
            action: 'yellow',
            player: player._id,
            match: match._id,
        });

        const addedEvent = await newEvent.save();
        match.events.push(addedEvent._id);

        const updatedMatch = await match.save();
        res.status(200).json(updatedMatch);

    } catch (error) {
        console.error('Error updating match card:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
);

router.patch('/update-match-status/:matchId/:divisionId', async (req, res) => {
    try {

        console.log("req.body ", req.body)
        console.log("req.params ", req.params)
        const updatedMatch = await Match.findById(req.params.matchId)
            .populate('team1')
            .populate('team2');

        const division = await Division.findById(req.params.divisionId);


        if (!updatedMatch || !division) {
            throw new Error('Match or Division not found');
        }

        if (req.body.status === 'En cours') {
            updatedMatch.status = 'En cours';
            updatedMatch.save();
        }

        if (req.body.status === 'Terminé') {


            // if (division.stages.length === 1 && division.tournamentType == "mixed") {
            //     console.log("stage 1")
            //     let team1Points = await TeamPoints.findOne({ division: req.params.divisionId, team: updatedMatch.team1._id });

            //     if (!team1Points) {
            //         team1Points = new TeamPoints({
            //             division: req.params.divisionId,
            //             team: updatedMatch.team1._id,
            //             points: []
            //         });
            //     }
            //     console.log("team1Points", team1Points)

            //     let team2Points = await TeamPoints.findOne({ division: req.params.divisionId, team: updatedMatch.team2._id });
            //     if (!team2Points) {
            //         team2Points = new TeamPoints({
            //             division: req.params.divisionId,
            //             team: updatedMatch.team2._id,
            //             points: []
            //         });
            //     }

            //     console.log("team2Points", team2Points)


            //     if (updatedMatch.goals.team1.players.length > updatedMatch.goals.team2.players.length) {
            //         console.log("team1 win")
            //         updatedMatch.winner = updatedMatch.team1._id;
            //         updatedMatch.loser = updatedMatch.team2._id;
            //         team1Points.points.push(3);
            //         team2Points.points.push(0);
            //         team1Points.save();
            //         team2Points.save();
            //     } else if (updatedMatch.goals.team1.players.length < updatedMatch.goals.team2.players.length) {
            //         console.log("team2 win")
            //         updatedMatch.winner = updatedMatch.team2._id;
            //         updatedMatch.loser = updatedMatch.team1._id;
            //         team2Points.points.push(3);
            //         team1Points.points.push(0);
            //         team1Points.save();
            //         team2Points.save();
            //     } else {
            //         console.log("draw")
            //         updatedMatch.draw = true;
            //         team1Points.points.push(1);
            //         team2Points.points.push(1);
            //         team1Points.save();
            //         team2Points.save();
            //     }

            // }
            if (division.tournamentType == "championship") {
                console.log("championship finish ")

                let team1Points = await TeamPoints.findOne({ division: req.params.divisionId, team: updatedMatch.team1._id });

                if (!team1Points) {
                    team1Points = new TeamPoints({
                        division: req.params.divisionId,
                        team: updatedMatch.team1._id,
                        points: []
                    });
                }
                console.log("team1Points", team1Points)

                let team2Points = await TeamPoints.findOne({ division: req.params.divisionId, team: updatedMatch.team2._id });
                if (!team2Points) {
                    team2Points = new TeamPoints({
                        division: req.params.divisionId,
                        team: updatedMatch.team2._id,
                        points: []
                    });
                }

                console.log("team2Points", team2Points)

                if (updatedMatch.goals.team1.players.length > updatedMatch.goals.team2.players.length) {
                    console.log("team1 win")
                    updatedMatch.winner = updatedMatch.team1._id;
                    updatedMatch.loser = updatedMatch.team2._id;
                    team1Points.points.push(3);
                    team2Points.points.push(0);
                    team1Points.save();
                    team2Points.save();
                } else if (updatedMatch.goals.team1.players.length < updatedMatch.goals.team2.players.length) {
                    console.log("team2 win")
                    updatedMatch.winner = updatedMatch.team2._id;
                    updatedMatch.loser = updatedMatch.team1._id;
                    team2Points.points.push(3);
                    team1Points.points.push(0);
                    team1Points.save();
                    team2Points.save();
                } else {
                    console.log("draw")
                    updatedMatch.draw = true;
                    team1Points.points.push(1);
                    team2Points.points.push(1);
                    team1Points.save();
                    team2Points.save();
                }

            }
            if (division.tournamentType == "mixed") {
                if (division.stages.length === 1) {

                    console.log("stage 1")
                    let team1Points = await TeamPoints.findOne({ division: req.params.divisionId, team: updatedMatch.team1._id });

                    if (!team1Points) {
                        team1Points = new TeamPoints({
                            division: req.params.divisionId,
                            team: updatedMatch.team1._id,
                            points: []
                        });
                    }
                    console.log("team1Points", team1Points)

                    let team2Points = await TeamPoints.findOne({ division: req.params.divisionId, team: updatedMatch.team2._id });
                    if (!team2Points) {
                        team2Points = new TeamPoints({
                            division: req.params.divisionId,
                            team: updatedMatch.team2._id,
                            points: []
                        });
                    }

                    console.log("team2Points", team2Points)
                    if (updatedMatch.goals.team1.players.length > updatedMatch.goals.team2.players.length) {
                        console.log("team1 win")
                        updatedMatch.winner = updatedMatch.team1._id;
                        updatedMatch.loser = updatedMatch.team2._id;
                        team1Points.points.push(3);
                        team2Points.points.push(0);
                        team1Points.save();
                        team2Points.save();
                    } else if (updatedMatch.goals.team1.players.length < updatedMatch.goals.team2.players.length) {
                        console.log("team2 win")
                        updatedMatch.winner = updatedMatch.team2._id;
                        updatedMatch.loser = updatedMatch.team1._id;
                        team2Points.points.push(3);
                        team1Points.points.push(0);
                        team1Points.save();
                        team2Points.save();
                    } else {
                        console.log("draw")
                        updatedMatch.draw = true;
                        team1Points.points.push(1);
                        team2Points.points.push(1);
                        team1Points.save();
                        team2Points.save();
                    }

                } else {

                    updatedMatch.status = 'Terminé';
                    if (updatedMatch.goals.team1.players.length > updatedMatch.goals.team2.players.length) {
                        console.log("team1 win")
                        updatedMatch.winner = updatedMatch.team1._id;
                        updatedMatch.loser = updatedMatch.team2._id;
                    } else if (updatedMatch.goals.team1.players.length < updatedMatch.goals.team2.players.length) {
                        console.log("team2 win")
                        updatedMatch.winner = updatedMatch.team2._id;
                        updatedMatch.loser = updatedMatch.team1._id;

                    } else {
                        console.log("draw")
                        updatedMatch.draw = true;
                    }

                }

            }
            if (division.tournamentType == "singlematch") {
                if (updatedMatch.goals.team1.players.length > updatedMatch.goals.team2.players.length) {
                    updatedMatch.winner = updatedMatch.team1._id;
                    updatedMatch.loser = updatedMatch.team2._id;
                } else {
                    updatedMatch.winner = updatedMatch.team2._id;
                    updatedMatch.loser = updatedMatch.team1._id;
                }
            }

            updatedMatch.status = 'Terminé';
            const result = await updatedMatch.save();
            console.log("result match", result)
        }

        res.status(200).json(updatedMatch);
    } catch (error) {
        console.error('Error updating match status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
);

router.get('/get-match/:matchId', async (req, res) => {
    try {
        const match = await Match.findById(req.params.matchId)
            .populate({ path: 'team1', populate: ['players', 'subtitutes'] })
            .populate({ path: 'team2', populate: ['players', 'subtitutes'] })
            .populate({ path: 'events', populate: ['player', 'substitute'] });

        res.json(match);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.get('/get-matches', async (req, res) => {
    try {
        const matches = await Match.find()
            .populate({ path: 'team1', populate: ['players', 'subtitutes'] })
            .populate({ path: 'team2', populate: ['players', 'subtitutes'] })
            .populate({ path: 'events', populate: ['player'] })
            .populate("division");
        res.json(matches);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.patch('/update-next-match/:matchId/:winnerId', async (req, res) => {
    try {
        const nextMatch = await Match.findById(req.params.matchId);
        const newTeam = await Team.findById(req.params.winnerId);
        console.log('winning team', newTeam, "id here ", req.params.winnerId);
        console.log('next match', nextMatch);

        if (nextMatch) {
            if (nextMatch.team1 && nextMatch.team2) {
                console.log("both teams are set");
                res.status(400).json({ error: 'Both teams are already set' });
            } else if (!nextMatch.team1) {
                console.log("team1 is not set");
                nextMatch.team1 = newTeam;
            } else if (!nextMatch.team2) {
                console.log("team2 is not set");
                nextMatch.team2 = newTeam;
            }

            const result = await nextMatch.save();
            res.status(200).json(result);
        } else {
            res.status(404).json({ error: 'Match not found' });
        }
    } catch (error) {
        console.error('Error updating next match:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function updateNextMatch(matchId) {
    try {
        const newTeam = req.body.team;
        console.log('winning team', newTeam)
        const nextMatch = await Match.findById(req.params.matchId);
        console.log('next match', nextMatch)
        if (nextMatch) {
            if (nextMatch.team1 && nextMatch.team2) {
                console.log("both teams are set");
                res.status(400).json({ error: 'Both teams are already set' });
            } else if (!nextMatch.team1) {
                console.log("team1 is not set");
                nextMatch.team1 = newTeam;
            } else if (!nextMatch.team2) {
                console.log("team2 is not set");
                nextMatch.team2 = newTeam;
            }

            const result = await nextMatch.save();
            res.status(200).json(result);
        } else {
            res.status(404).json({ error: 'Match not found' });
        }
    } catch (error) {
        console.error('Error updating next match:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Update match time

router.put('/addTime/:idmatch', async (req, res) => {
    const idmatch = req.params.idmatch;
    const newTime = req.body.time;

    try {
        const match = await Match.findByIdAndUpdate(idmatch, { time: newTime }, { new: true });
        if (!match) {
            res.status(404).send({ message: 'Match not found' });
        } else {
            res.status(200).send({ match });
        }
    } catch (err) {
        res.status(500).send({ message: 'Error updating match' });
    }
});





//? FRONT OFFICE ****************************************************

router.get('/front/getMatches/:divisionId', async (req, res) => {
    try {
        const matches = await Match.find({ division: req.params.divisionId }).populate('team1').populate('team2').populate('winner').populate('events');
        res.status(200).json({ matches });
    } catch (error) {
        console.error('Error getting matches:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('/front/matchesbytournament/:tournamentId', async (req, res) => {
    try {
        const tournamentId = req.params.tournamentId;
        const divisions = await Division.find({ tournament: tournamentId });

        console.log("divisions", divisions);
        // Extract division IDs
        const divisionIds = divisions.map(division => division._id);
        console.log("divisionIds", divisionIds);

        const matches = await Match.find({ division: { $in: divisionIds } })
            .populate('team1')  // Assuming you want to populate these fields
            .populate('team2')
            .populate({
                path: 'division',
                select: 'name',
                populate: {
                    path: 'tournament',
                    select: 'tournamentName'
                }
            });

        res.json(matches);
    } catch (error) {
        console.error("Error fetching matches:", error);
        res.status(500).send("Error fetching matches");
    }
});

// getting the matches with populate divisions with populate tournament
router.get('/front/getMatches', async (req, res) => {
    try {
        const matches = await Match.find().populate('team1').populate('team2').populate({ path: 'division', populate: { path: 'tournament' } });
        res.status(200).json({ matches });
    } catch (error) {
        console.error('Error getting matches:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//? FRONT OFFICE ****************************************************
router.get('/front/getMatchesByTournament/:tournamentId', async (req, res) => {
    try {
        const tournamentId = req.params.tournamentId;
        console.log("tournamentId", tournamentId);
        const matches = await Match.find()
            .populate('team1')
            .populate('team2')
            .populate({ path: 'division', populate: { path: 'tournament' } });

        const filteredMatches = matches.filter(match => match.division.tournament._id.toString() === tournamentId);
        console.log("filteredMatches", filteredMatches);
        res.status(200).json({ filteredMatches });
    } catch (error) {
        console.error('Error getting matches:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// get the last 5 matches where status is 'Terminé' populating the team1, team2 and the players who scored
router.get('/front/getLastMatches', async (req, res) => {
    try {
        const matches = await Match.find({ status: 'Terminé' }).sort({ date: -1 }).limit(5)
            .populate('team1')
            .populate('team2')
            .populate('goals.team1.players')
            .populate('goals.team2.players');
        res.status(200).json({ matches });
    } catch (error) {
        console.error('Error getting matches:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/nextMatch', async (req, res) => {
    try {
        const now = new Date();
        const nextMatch = await Match.findOne({ time: { $gte: now } }).sort({ time: 1 });
        if (!nextMatch) {
            return res.status(404).json({ message: 'No upcoming match found' });
        }
        res.status(200).json(nextMatch);
    } catch (error) {
        console.error('Error fetching next match:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});




router.get('/front/matchesbytournament/:tournamentId', async (req, res) => {
    try {
        const tournamentId = req.params.tournamentId;
        const divisions = await Division.find({ tournament: tournamentId });

        console.log("divisions", divisions);
        // Extract division IDs
        const divisionIds = divisions.map(division => division._id);
        console.log("divisionIds", divisionIds);

        const matches = await Match.find({ division: { $in: divisionIds } })
            .populate('team1')  // Assuming you want to populate these fields
            .populate('team2')
            .populate({
                path: 'division',
                select: 'name',
                populate: {
                    path: 'tournament',
                    select: 'tournamentName'
                }
            });

        res.json(matches);
    } catch (error) {
        console.error("Error fetching matches:", error);
        res.status(500).send("Error fetching matches");
    }
});


router.get('/players-stats', async (req, res) => {
    try {
        const stats = await Match.aggregate([

            {
                $project: {
                    "players": { $concatArrays: ["$goals.team1.players", "$goals.team2.players"] }
                }
            },

            { $unwind: "$players" },

            {
                $group: {
                    _id: "$players",
                    goalsCount: { $sum: 1 }
                }
            },

            {
                $lookup: {
                    from: "players",
                    localField: "_id",
                    foreignField: "_id",
                    as: "playerDetails"
                }
            },
            {
                $unwind: {
                    path: "$playerDetails",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $project: {
                    _id: 0,
                    playerName: { $concat: ["$playerDetails.firstName", " ", "$playerDetails.lastName"] },
                    goalsCount: 1
                }
            },

            { $sort: { goalsCount: -1 } }
        ]);

        res.json(stats);
    } catch (error) {
        console.error('Error fetching player stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/top-scorer', async (req, res) => {
    try {
        const stats = await Match.aggregate([
            {
                $project: {
                    "players": { $concatArrays: ["$goals.team1.players", "$goals.team2.players"] }
                }
            },
            { $unwind: "$players" },
            {
                $group: {
                    _id: "$players",
                    goalsCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "players",
                    localField: "_id",
                    foreignField: "_id",
                    as: "playerDetails"
                }
            },
            { $unwind: "$playerDetails" },
            {
                $project: {
                    _id: 0,
                    playerName: { $concat: ["$playerDetails.firstName", " ", "$playerDetails.lastName"] },
                    avatar: "$playerDetails.avatar",
                    goalsCount: 1,
                    height: "$playerDetails.height",
                    age: "$playerDetails.age",
                    playerNumber: "$playerDetails.playerNumber"
                }
            },
            { $sort: { goalsCount: -1 } },
            { $limit: 1 }
        ]);

        if (stats.length > 0) {
            res.json(stats[0]);
        } else {
            res.status(404).json({ message: "Aucun joueur trouvé" });
        }
    } catch (error) {
        console.error('Error fetching top scorer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});










module.exports = router;