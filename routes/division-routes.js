const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/AuthenticateUser');
const Division = require('../models/Division');
const Team = require('../models/Team');
const Stage = require('../models/Stage');
const TeamPoints = require('../models/TeamPoints');
const Match = require('../models/Match');
const Group = require('../models/Group');
const multer = require('multer');
const path = require('path')





const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/'); // store files in 'images' folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // generate unique filename
    },
});

// Initialize multer instance with the defined storage
const upload = multer({ storage: storage });



router.get('/divisionsAdmin', async (req, res) => {
    try {
        const divisions = await Division.find()
            .populate('tournament')
            .populate({
                path: 'teams',
                populate: ['players', 'subtitutes']
            })
            .populate({
                path: 'stages',
                populate: {
                    path: 'groups',
                    populate: {
                        path: 'teams',
                        populate: ['players', 'subtitutes']
                    }
                }
            });
        res.status(200).json(divisions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});




router.get('/divisions/:id', authenticateUser, async (req, res) => {
    try {
        const divisions = await Division.find({ tournament: req.params.id })
            .populate({
                path: 'teams',
                populate: ['players', 'subtitutes']
            })
            .populate({
                path: 'stages',
                populate: {
                    path: 'groups',
                    populate: {
                        path: 'teams',
                        populate: ['players', 'subtitutes']
                    }
                }
            });
        res.status(200).json({ divisions });
    } catch (error) {
        console.error('Error getting divisions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



router.get('/get-division-byId/:id', async (req, res) => {
    const divisionId = req.params.id;

    try {
        const division = await Division.findById(divisionId)
            .populate('teams')
            .populate({
                path: 'stages',
                populate: {
                    path: 'groups',
                    populate: [{
                        path: 'teams',
                        populate: ['players', 'subtitutes']
                    }, {
                        path: 'matches',
                        populate: ['team1', 'team2']
                    }]
                }
            });
        res.json(division);
    } catch (error) {
        console.error('Error getting teams:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.get('/get-division-byTeamId/:id', async (req, res) => {
    const teamId = req.params.id;

    try {
        const division = await Division.findOne({ teams: teamId });

        res.json(division);
    }
    catch (error) {
        console.error('Error getting teams:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// khali rak badaltha zidt il populate mtaa il tournament
router.get('/division/teams/:id', async (req, res) => {
    const divisionId = req.params.id;

    try {
        const division = await Division.findById(divisionId)
            .populate('teams');

        res.json(division.teams);
    } catch (error) {
        console.error('Error getting teams:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/poptournament/division/teams/:id', async (req, res) => {
    const divisionId = req.params.id;

    try {
        const division = await Division.findById(divisionId)
            .populate('teams').populate('tournament');

        res.json(division);
    } catch (error) {
        console.error('Error getting teams:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});




// get all divisions with populate 
router.get('/get-divisions', async (req, res) => {
    try {
        const divisions = await Division.find()
            .populate({
                path: 'teams',
                populate: ['players', 'subtitutes']
            })
            .populate({
                path: 'stages',
                populate: {
                    path: 'groups',
                    populate: {
                        path: 'teams',
                        populate: ['players', 'subtitutes']
                    }
                }
            });
        res.json(divisions);
    } catch (error) {
        console.error('Error getting division:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// router.put('/division/:id', authenticateUser, upload.array('images'), async (req, res) => {
//     const divisionId = req.params.id;
//     const teams = req.body.teams;
//     const division = await Division.findById(divisionId);
//     let teamsIds = []; // Initialize an empty array to store the team IDs

//     // Save each team in the "teams" collection
//     var counter = 0;
//     console.log(teams)

//     for (let team of teams) {
//         // Check if the team already exists
//         const ExistingTeam = await Team.findOne({ name: team.name });
//         if (ExistingTeam) {
//             console.log('Team already exists:', ExistingTeam);
//             teamsIds.push(ExistingTeam._id); // Add the existing team's ID to the array
//             continue;
//         }else{
//                 console.log(team._id)
//                 team.logo = req.files[counter].path;

//                 const newTeam = new Team(team);
//                 newTeam.division = division.name;


//                 await newTeam.save();

//                 teamsIds.push(newTeam._id); // Add the saved team's ID to the array
//                 counter++;
//     }
// }


//     division.teams = teamsIds;
//     // Set the other fields from req.body
//     division.tournamentType = req.body.tournamentType;
//     division.PlayerPerTeam = req.body.PlayerPerTeam;
//     division.ExtraTime = req.body.ExtraTime;
//     division.NumberTeams = req.body.NumberTeams;
//     division.MatchDuration = req.body.MatchDuration;
//     division.status = "progress";
//     division.save();



//     try {
//         const updatedDivision = await Division.findByIdAndUpdate(divisionId, division, { new: true }); 
//         res.json(updatedDivision);
//     } catch (error) {
//         console.error('Error updating division:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });


router.put('/division/:id', upload.array('images'), async (req, res) => {
    const divisionId = req.params.id;
    const teams = req.body.teams;

    const division = await Division.findById(divisionId);
    let teamsIds = [];

    var counter = 0;
    console.log(teams)

    for (let team of teams) {
        // Check if the team already exists
        const ExistingTeam = await Team.findOne({ name: team.name });
        if (ExistingTeam) {
            console.log('Team already exists:', ExistingTeam);
            teamsIds.push(ExistingTeam._id); // Add the existing team's ID to the array
            continue;
        } else {
            console.log(team._id)
            team.logo = req.files[counter].path;

            const newTeam = new Team(team);
            newTeam.division = division.name;


            await newTeam.save();

            teamsIds.push(newTeam._id); // Add the saved team's ID to the array
            counter++;
        }
    }


    division.teams = teamsIds;
    // Set the other fields from req.body
    division.tournamentType = req.body.tournamentType;
    division.PlayerPerTeam = req.body.PlayerPerTeam;
    division.ExtraTime = req.body.ExtraTime;
    division.NumberTeams = req.body.NumberTeams;
    division.MatchDuration = req.body.MatchDuration;
    division.status = "progress";
    division.save();



    try {
        const updatedDivision = await Division.findByIdAndUpdate(divisionId, division, { new: true });
        res.json(updatedDivision);
    } catch (error) {
        console.error('Error updating division:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});




router.post('/verify-devision-state/:divisionId', authenticateUser, async (req, res) => {
    
    const divisionId = req.params.divisionId;
    const division = await Division.findById(divisionId)
        .populate('teams')
        .populate({
            path: 'stages',
            populate: {
                path: 'groups',
                populate: ['teams', 'matches']
            }
        });

    // Check if the first stage is done
    if (division.stages.length == 1) {
        var firstStageDone = true;
        const stage = division.stages[0];
        stage.groups.map(group => {
            group.matches.map(match => {
                if (match.status !== 'Terminé') {
                    firstStageDone = false;
                }
            });
        });

        if (firstStageDone) {
            // Create the second stage
            const newStage = new Stage({
                division: divisionId,
                number: 1,
                finished: false,
                groups: []
            });

            await newStage.save();
            await Division.findByIdAndUpdate(divisionId, { $push: { stages: newStage._id } });
        }
    }

    res.status(200).json({ message: 'Division state verified' });
}
);




// const determineTop2teams = (teams, matches) => {

//     const calculatePoints = (team, matches) => {
//         const points = matches.reduce((acc, match) => {
//             if (match.winner == team._id) {
//                 return acc + 3;
//             }
//             else if (match.draw == true) {
//                 return acc + 1;
//             } else {
//                 return acc;
//             }
//         }, 0);

//         return { team: team, points: points };
//     }

//     const teamsWithPoints = teams.map(team => {
//         return {
//             team: team,
//             matches: matches.filter(match => match.team1 == team._id || match.team2 == team._id),
//             points: 0
//         }
//     });

//     teamsWithPoints.forEach(teamWithPoints => {
//         teamWithPoints.matches

//         // const teamsWithPoints = teams.map(team => {
//         //     const teamMatches = matches.filter(match => match.team1 == team._id || match.team2 == team._id);
//         //     const points = teamMatches.reduce((acc, match) => {
//         //         if (match.scoreTeam1 > match.scoreTeam2) {
//         //             return acc + 3;
//         //         } else if (match.scoreTeam1 == match.scoreTeam2) {
//         //             return acc + 1;
//         //         } else {
//         //             return acc;
//         //         }
//         //     }, 0);

//         //     return sortedTeams.slice(0, 2);
//         // });
//     }

// router.post('/verify-division-states', async (req, res) => {

//         const divisionId = req.body.divisionId;
//         const division = await Division.findById(divisionId)
//             .populate('teams')
//             .populate({
//                 path: 'stages',
//                 populate: {
//                     path: 'groups',
//                     populate: [{
//                         path: 'teams',
//                         populate: ['players', 'subtitutes']
//                     }, {
//                         path: 'matches',
//                         populate: ['team1', 'team2']
//                     }]
//                 }
//             });


//         //CHECK IF FIRST STAGE IS DONE
//         if (division.stages.length == 1) {
//             const firstStageDone = true;
//             const stage = division.stages[0];
//             stage.groups.map(group => {
//                 group?.matches.map(match => {
//                     if (match.status !== 'Terminé') {
//                         firstStageDone = false;
//                     }
//                 });
//             });

//             if (firstStageDone) {
//                 //CREATE SECOND STAGE

//                 // division: {
//                 //     type: mongoose.Schema.Types.ObjectId,
//                 //         ref: 'Division',
//                 //             required: true,
//                 // },
//                 // number: {
//                 //     type: Number,
//                 //         required: true,
//                 // },
//                 // finished: {
//                 //     type: Boolean,
//                 //         required: true,
//                 //     default: false,
//                 // },
//                 // groups: [{
//                 //     type: mongoose.Schema.Types.ObjectId,
//                 //     ref: 'Group',
//                 // }]
//                 const newStage = new Stage({
//                     division: divisionId,
//                     number: 1,
//                     finished: false,
//                     groups: []
//                 });
//             }
//         }
//     });







// for testing
router.get('/xxx/:id', async (req, res) => {
    try {
        const divisions = await Division.find({ tournament: req.params.id })
            .populate({
                path: 'teams',
                populate: ['players', 'subtitutes']
            })
            .populate({
                path: 'stages',
                populate: {
                    path: 'groups',
                    populate: {
                        path: 'teams',
                        populate: ['players', 'subtitutes']
                    }
                }
            });
        res.status(200).json({ divisions });
    } catch (error) {
        console.error('Error getting divisions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
//? mixed specefic methods ****************************************************

const determineTop2teams = async (teams, matches, division) => {

    const teamsWithPoints = new Map();


    await Promise.all(
        teams.map(async (team) => {
            const teamPoints = await TeamPoints.findOne({ team: team._id, division: division._id });
            teamsWithPoints.set(team._id, teamPoints.points.reduce((acc, point) => acc + point, 0))
        }));


    const sortedTeamsWithPoints = [...teamsWithPoints.entries()].sort((a, b) => b[1] - a[1]);

    console.log("sortedTeamsWithPoints : ", sortedTeamsWithPoints);

    // perfect case where top 2 teams have different points
    if (sortedTeamsWithPoints[0][1] != sortedTeamsWithPoints[1][1] && sortedTeamsWithPoints[1][1] != sortedTeamsWithPoints[2][1]) {
        console.log("perfect result ", [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[1][0]])
        return [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[1][0]];
    }

    // case where top 2 teams have the same points
    // find the goal difference of each team
    var result;


    console.log("still here")


    if (sortedTeamsWithPoints[0][1] == sortedTeamsWithPoints[1][1] && sortedTeamsWithPoints[1][1] != sortedTeamsWithPoints[2][1]) {

        return [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[1][0]];
    }


    if (sortedTeamsWithPoints[0][1] !== sortedTeamsWithPoints[1][1] && sortedTeamsWithPoints[1][1] == sortedTeamsWithPoints[2][1]) {

        console.log("matches.filter ", matches.filter(match => match.team1.toString() == sortedTeamsWithPoints[1][0].toString() || match.team2.toString() == sortedTeamsWithPoints[1][0].toString()))
        const goalScoredTeam1 = matches
            .filter(match => match.team1.toString() == sortedTeamsWithPoints[1][0].toString() || match.team2.toString() == sortedTeamsWithPoints[1][0].toString())
            .reduce((acc, match) => {
                console.log("sortedTeamsWithPoints[0][0] ", sortedTeamsWithPoints[1][0])
                if (match.team1.toString() == sortedTeamsWithPoints[1][0].toString()) {
                    console.log("match.goals.team1.players.length ", match.goals.team1.players.length);
                    return acc + match.goals.team1.players.length;
                } else {
                    console.log("match.goals.team2.players.length; ", match.goals.team2.players.length);
                    return acc + match.goals.team2.players.length;
                }
            }
                , 0);


        const goalScoredTeam2 = matches
            .filter(match => match.team1.toString() == sortedTeamsWithPoints[2][0].toString() || match.team2.toString() == sortedTeamsWithPoints[2][0].toString())
            .reduce((acc, match) => {
                if (match.team1.toString() == sortedTeamsWithPoints[2][0].toString()) {
                    return acc + match.goals.team1.players.length;
                } else {
                    return acc + match.goals.team2.players.length;
                }
            }
                , 0);

        console.log("goalScoredTeam1 : ", goalScoredTeam1);
        console.log("goalScoredTeam2 : ", goalScoredTeam2);


        if (goalScoredTeam1 > goalScoredTeam2) {

            console.log("goalScoredTeam1 > goalScoredTeam2");
            result = [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[1][0]];
            return result;

        } else if (goalScoredTeam1 < goalScoredTeam2) {

            console.log("goalScoredTeam1 < goalScoredTeam2");
            result = [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[2][0]];
            return result;

        } else {
            if (goalScoredTeam1 == goalScoredTeam2) {

                console.log("goalScoredTeam1 == goalScoredTeam2");
                // check yellow cards
                const yellowCardsTeam1 = matches
                    .filter(match => match.team1.toString() == sortedTeamsWithPoints[1][0].toString() || match.team2.toString() == sortedTeamsWithPoints[1][0].toString())
                    .reduce((acc, match) => {
                        if (match.team1.toString() == sortedTeamsWithPoints[1][0].toString()) {
                            return acc + match.cardCounts.team1.yellow.players.length;
                        } else {
                            return acc + match.cardCounts.team2.yellow.players.length;
                        }
                    }
                        , 0);

                const yellowCardsTeam2 = matches
                    .filter(match => match.team1.toString() == sortedTeamsWithPoints[2][0].toString() || match.team2.toString() == sortedTeamsWithPoints[2][0].toString())
                    .reduce((acc, match) => {
                        if (match.team1.toString() == sortedTeamsWithPoints[2][0].toString()) {
                            return acc + match.cardCounts.team1.yellow.players.length;
                        } else {
                            return acc + match.cardCounts.team2.yellow.players.length;
                        }
                    }
                        , 0);

                if (yellowCardsTeam1 < yellowCardsTeam2) {
                    console.log("yellowCardsTeam1 < yellowCardsTeam2");
                    result = [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[1][0]];
                    return result;
                } else if (yellowCardsTeam1 > yellowCardsTeam2) {
                    console.log("yellowCardsTeam1 > yellowCardsTeam2");
                    result = [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[2][0]];
                    return result;
                } else if (yellowCardsTeam1 == yellowCardsTeam2) {
                    console.log("yellowCardsTeam1 == yellowCardsTeam2");
                    const redCardsTeam1 = matches
                        .filter(match => match.team1.toString() == sortedTeamsWithPoints[1][0].toString() || match.team2.toString() == sortedTeamsWithPoints[1][0].toString())
                        .reduce((acc, match) => {
                            if (match.team1.toString() == sortedTeamsWithPoints[1][0].toString()) {
                                return acc + match.cardCounts.team1.yellow.players.length;
                            } else {
                                return acc + match.cardCounts.team2.yellow.players.length;
                            }
                        }
                            , 0);

                    const redCardsTeam2 = matches
                        .filter(match => match.team1.toString() == sortedTeamsWithPoints[2][0].toString() || match.team2.toString() == sortedTeamsWithPoints[2][0].toString())
                        .reduce((acc, match) => {
                            if (match.team1.toString() == sortedTeamsWithPoints[2][0].toString()) {
                                return acc + match.cardCounts.team1.red.players.length;
                            } else {
                                return acc + match.cardCounts.team2.red.players.length;
                            }
                        }
                            , 0);

                    if (redCardsTeam1 < redCardsTeam2) {
                        console.log("redCardsTeam1 < redCardsTeam2");
                        result = [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[1][0]];
                        return result;
                    }
                    else if (redCardsTeam1 > redCardsTeam2) {
                        console.log("redCardsTeam1 > redCardsTeam2");
                        result = [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[2][0]];
                    }
                    else {
                        console.log("redCardsTeam1 == redCardsTeam2");
                        result = [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[1][0]];
                        return result;
                    }
                }
            }
        }

    }


    console.log("none matched :/  ", result);


    return [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[1][0]];

    // teamsWithPoints.sort((a, b) => b - a);

    // const sortedTeams = teamsWithPoints.sort((a, b) => b.points - a.points);
    // return sortedTeams.slice(0, 2);
}

router.get('/verify-division/:id', async (req, res) => {
    const divisionId = req.params.id;
    const division = await Division.findById(divisionId)
        .populate('teams')
        .populate({
            path: 'stages',
            populate: {
                path: 'groups',
                populate: ['teams', 'matches']
            }
        });

    // Check if the first stage is done
    if (division.stages.length == 1) {
        let firstStageDone = true;
        const stage = division.stages[0];
        stage.groups.map(group => {
            group.matches.map(match => {
                if (match.status !== 'Terminé') {
                    firstStageDone = false;
                }
            });
        });

        console.log('firstStage state : ', firstStageDone)
        if (firstStageDone) {


            const newStage = new Stage({
                division: divisionId,
                number: 1,
                finished: false,
                groups: []
            });

            var newGroups;
            await Promise.all(

                newGroups = division.stages[0].groups.map(async (group, index) => {
                    console.log('group : ', group.name)
                    const top2teams = await determineTop2teams(group.teams, group.matches, division);
                    console.log('top2teams : ', top2teams);
                    const newGroup = new Group({
                        name: String.fromCharCode(65 + index),
                        teams: top2teams,
                        stage: newStage._id,
                    });
                    return newGroup;
                })
            );

            newGroups = await Promise.all(newGroups);



            console.log("newGroups ", newGroups);
            var stage2Groups = [];

            for (let i = 0; i < newGroups.length; i += 2) {

                const match1 = new Match({
                    team1: newGroups[i].teams[0],
                    team2: newGroups[i + 1].teams[1],
                    division: divisionId,
                });

                const match2 = new Match({
                    team1: newGroups[i].teams[1],
                    team2: newGroups[i + 1].teams[0],
                    division: divisionId,
                });

                const group1 = new Group({
                    name: String.fromCharCode(65 + i),
                    teams: [newGroups[i].teams[0], newGroups[i + 1].teams[1]],
                    matches: [match1._id],
                    stage: newStage._id,
                });

                const group2 = new Group({
                    name: String.fromCharCode(65 + i + 1),
                    teams: [newGroups[i].teams[1], newGroups[i + 1].teams[0]],
                    matches: [match2._id],
                    stage: newStage._id,
                });

                console.log("new groups here ", newGroups);

                stage2Groups.push(group1._id);
                stage2Groups.push(group2._id);

                console.log("stage2Groups : ", stage2Groups);
                console.log("group1 : ", group1);
                console.log("group2 : ", group2);


                await match1.save();
                await match2.save();

                await group1.save();
                await group2.save();
            }



            newStage.groups = stage2Groups;

            console.log("newStage : ", newStage);
            const savedStage = await newStage.save();
            console.log("savedStage : ", savedStage);

            await Division.findByIdAndUpdate(divisionId, { $push: { stages: newStage._id } });
        }
    }

    // if (division.stages.length > 3) {
    //     console.log("division done", division.stages[division.stages.length - 1].groups.length == 1 && division.stages[division.stages.length - 1].groups[0].teams.length == 1);
    //     return;
    // }
    if (division.stages.length > 1) {


        var stageDone = true;
        const stage = division.stages[division.stages.length - 1];
        stage.groups.map(group => {
            group.matches.map(match => {
                if (match.status !== 'Terminé') {
                    stageDone = false;
                }
            });
        });

        console.log('stageDone : ', stageDone)
        if (stageDone) {


            const newStage = new Stage({
                division: divisionId,
                number: division.stages.length,
                finished: false,
                groups: []
            });

            if (stage.groups.length == 1) {

                const newGroup = new Group({
                    name: 'final',
                    teams: [stage.groups[0].matches[0].winner],
                    stage: newStage._id,
                });

                await Division.findByIdAndUpdate(stage.groups[0].matches[0].division, { status: 'completed' });

                await newGroup.save();

                newStage.groups = [newGroup._id];

                const savedStage = await newStage.save();
                console.log("final savedStage : ", savedStage);

                await Division.findByIdAndUpdate(divisionId, { $push: { stages: newStage._id } });
            } else {
                let newGroups = [];





                for (let i = 0; i < stage.groups.length; i += 2) {

                    const match = new Match({
                        team1: stage.groups[i].matches[0].winner,
                        team2: stage.groups[i + 1].matches[0].winner,
                        division: divisionId,
                    });

                    await match.save();

                    console.log('new match : ', match);

                    const group = new Group({
                        name: String.fromCharCode(65 + i),
                        teams: [stage.groups[i].matches[0].winner, stage.groups[i + 1].matches[0].winner],
                        matches: [match._id],
                        stage: newStage._id,
                    });

                    await group.save();


                    newGroups.push(group);

                }

                newGroups = await Promise.all(newGroups);
                newStage.groups = newGroups;

                const savedStage = await newStage.save();
                console.log("savedStage : ", savedStage);

                await Division.findByIdAndUpdate(divisionId, { $push: { stages: newStage._id } });
            }


        }
    }


    res.status(200).json({ message: 'Division state verified' });
}
);



const determineTop2teamsChampion = async (teams, matches, division) => {

    const teamsWithPoints = new Map();


    await Promise.all(
        teams.map(async (team) => {
            const teamPoints = await TeamPoints.findOne({ team: team._id, division: division._id });
            if (teamPoints)
                teamsWithPoints.set(team._id, teamPoints.points.reduce((acc, point) => acc + point, 0))
        }));


    const sortedTeamsWithPoints = [...teamsWithPoints.entries()].sort((a, b) => b[1] - a[1]);

    console.log("sortedTeamsWithPoints : ", sortedTeamsWithPoints);

    // perfect case where top 2 teams have different points
    if (sortedTeamsWithPoints[0][1] != sortedTeamsWithPoints[1][1] && sortedTeamsWithPoints[1][1] != sortedTeamsWithPoints[2][1]) {
        console.log("perfect result ", [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[1][0]])
        return [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[1][0]];
    }
    

    var result;


    console.log("still here")


    if (sortedTeamsWithPoints[0][1] == sortedTeamsWithPoints[1][1] && sortedTeamsWithPoints[1][1] != sortedTeamsWithPoints[2][1]) {

        return [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[1][0]];
    }


    if (sortedTeamsWithPoints[0][1] !== sortedTeamsWithPoints[1][1] && sortedTeamsWithPoints[1][1] == sortedTeamsWithPoints[2][1]) {

        console.log("matches.filter ", matches.filter(match => match.team1.toString() == sortedTeamsWithPoints[1][0].toString() || match.team2.toString() == sortedTeamsWithPoints[1][0].toString()))
        const goalScoredTeam1 = matches
            .filter(match => match.team1.toString() == sortedTeamsWithPoints[1][0].toString() || match.team2.toString() == sortedTeamsWithPoints[1][0].toString())
            .reduce((acc, match) => {
                console.log("sortedTeamsWithPoints[0][0] ", sortedTeamsWithPoints[1][0])
                if (match.team1.toString() == sortedTeamsWithPoints[1][0].toString()) {
                    console.log("match.goals.team1.players.length ", match.goals.team1.players.length);
                    return acc + match.goals.team1.players.length;
                } else {
                    console.log("match.goals.team2.players.length; ", match.goals.team2.players.length);
                    return acc + match.goals.team2.players.length;
                }
            }
                , 0);


        const goalScoredTeam2 = matches
            .filter(match => match.team1.toString() == sortedTeamsWithPoints[2][0].toString() || match.team2.toString() == sortedTeamsWithPoints[2][0].toString())
            .reduce((acc, match) => {
                if (match.team1.toString() == sortedTeamsWithPoints[2][0].toString()) {
                    return acc + match.goals.team1.players.length;
                } else {
                    return acc + match.goals.team2.players.length;
                }
            }
                , 0);

        console.log("goalScoredTeam1 : ", goalScoredTeam1);
        console.log("goalScoredTeam2 : ", goalScoredTeam2);


        if (goalScoredTeam1 > goalScoredTeam2) {

            console.log("goalScoredTeam1 > goalScoredTeam2");
            result = [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[1][0]];
            return result;

        } else if (goalScoredTeam1 < goalScoredTeam2) {

            console.log("goalScoredTeam1 < goalScoredTeam2");
            result = [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[2][0]];
            return result;

        } else {
            if (goalScoredTeam1 == goalScoredTeam2) {

                console.log("goalScoredTeam1 == goalScoredTeam2");
                // check yellow cards
                const yellowCardsTeam1 = matches
                    .filter(match => match.team1.toString() == sortedTeamsWithPoints[1][0].toString() || match.team2.toString() == sortedTeamsWithPoints[1][0].toString())
                    .reduce((acc, match) => {
                        if (match.team1.toString() == sortedTeamsWithPoints[1][0].toString()) {
                            return acc + match.cardCounts.team1.yellow.players.length;
                        } else {
                            return acc + match.cardCounts.team2.yellow.players.length;
                        }
                    }
                        , 0);

                const yellowCardsTeam2 = matches
                    .filter(match => match.team1.toString() == sortedTeamsWithPoints[2][0].toString() || match.team2.toString() == sortedTeamsWithPoints[2][0].toString())
                    .reduce((acc, match) => {
                        if (match.team1.toString() == sortedTeamsWithPoints[2][0].toString()) {
                            return acc + match.cardCounts.team1.yellow.players.length;
                        } else {
                            return acc + match.cardCounts.team2.yellow.players.length;
                        }
                    }
                        , 0);

                if (yellowCardsTeam1 < yellowCardsTeam2) {
                    console.log("yellowCardsTeam1 < yellowCardsTeam2");
                    result = [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[1][0]];
                    return result;
                } else if (yellowCardsTeam1 > yellowCardsTeam2) {
                    console.log("yellowCardsTeam1 > yellowCardsTeam2");
                    result = [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[2][0]];
                    return result;
                } else if (yellowCardsTeam1 == yellowCardsTeam2) {
                    console.log("yellowCardsTeam1 == yellowCardsTeam2");
                    const redCardsTeam1 = matches
                        .filter(match => match.team1.toString() == sortedTeamsWithPoints[1][0].toString() || match.team2.toString() == sortedTeamsWithPoints[1][0].toString())
                        .reduce((acc, match) => {
                            if (match.team1.toString() == sortedTeamsWithPoints[1][0].toString()) {
                                return acc + match.cardCounts.team1.yellow.players.length;
                            } else {
                                return acc + match.cardCounts.team2.yellow.players.length;
                            }
                        }
                            , 0);

                    const redCardsTeam2 = matches
                        .filter(match => match.team1.toString() == sortedTeamsWithPoints[2][0].toString() || match.team2.toString() == sortedTeamsWithPoints[2][0].toString())
                        .reduce((acc, match) => {
                            if (match.team1.toString() == sortedTeamsWithPoints[2][0].toString()) {
                                return acc + match.cardCounts.team1.red.players.length;
                            } else {
                                return acc + match.cardCounts.team2.red.players.length;
                            }
                        }
                            , 0);

                    if (redCardsTeam1 < redCardsTeam2) {
                        console.log("redCardsTeam1 < redCardsTeam2");
                        result = [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[1][0]];
                        return result;
                    }
                    else if (redCardsTeam1 > redCardsTeam2) {
                        console.log("redCardsTeam1 > redCardsTeam2");
                        result = [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[2][0]];
                    }
                    else {
                        console.log("redCardsTeam1 == redCardsTeam2");
                        result = [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[1][0]];
                        return result;
                    }
                }
            }
        }

    }


    console.log("none matched :/  ", result);


    return [sortedTeamsWithPoints[0][0], sortedTeamsWithPoints[1][0]];

}

router.get('/verify-division-championship/:id', async (req, res) => {
    const divisionId = req.params.id;
    const division = await Division.findById(divisionId)
        .populate('teams')
        .populate({
            path: 'stages',
            populate: {
                path: 'groups',
                populate: ['teams', 'matches']
            }
        });


    const matches = await Match.find({ division: divisionId });

    console.log('matches here : ', matches);
    console.log('matches.length here : ', matches.length);
    console.log('division arslen ', division);


    const top2teams = await determineTop2teamsChampion(division.teams, matches, division);
    console.log("top2teams in championShip : ", top2teams);
    return res.json(top2teams[0]);
}
);
//? mixed specefic methods ****************************************************



//? FRONT OFFICE ****************************************************

router.get('/front/divisions/:tournamentid', async (req, res) => {
    try {
        const tournamentid = req.params.tournamentid;
        const divisions = await Division.find({ tournament: tournamentid })
            .populate([
                {
                    path: 'stages',
                    populate: {
                        path: 'groups',
                        populate: {
                            path: 'teams'
                        }
                    }
                }
            ]);
        res.status(200).json(divisions);
    } catch (error) {
        console.error('Error getting division:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//? FRONT OFFICE ****************************************************


module.exports = router;