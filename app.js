
const express = require("express")
const app = express()
const connectToDatabase = require('./config/database')
const cors = require('cors')

const http = require("http")
const socketIo = require("socket.io");
const Match = require('./models/Match');




app.use(express.json());
app.use(cors());



const users = require('./routes/user-routes')
app.use('/user', users)



const players = require('./routes/player-routes')
app.use('/player', players)






const tournaments = require('./routes/tournament-routes')
app.use('/tournament', tournaments)


const divisions = require('./routes/division-routes')
app.use('/division', divisions)


const teams = require('./routes/teams-routes')
app.use('/team', teams)


const matches = require('./routes/matche-routes')
app.use('/match', matches)


const groups = require('./routes/group-routes')
app.use('/group', groups)

const stages = require('./routes/stage-routes')
app.use('/stage', stages)


const teamPoints = require('./routes/teamPoints-routes')
app.use('/teamPoints', teamPoints)

const contact = require('./routes/contact-routes')
app.use('/contact', contact)



const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  }
});

io.on('connection', (socket) => {
  console.log('Nouvel utilisateur connecté');


  socket.on('updateScore', async (matchData) => {
    try {

      await Match.updateMatchScore(matchData._id, matchData.scoreTeam1, matchData.scoreTeam2);


      const updatedMatch = await Match.findById(matchData._id)
        .populate('team1', 'name logo')
        .populate('team2', 'name logo')
        .populate('division', 'name');

      if (!updatedMatch) {
        throw new Error('Match not found after update');
      }


      const adaptedMatch = {
        _id: updatedMatch._id,
        team1Logo: updatedMatch.team1.logo,
        team2Logo: updatedMatch.team2.logo,
        team1Name: updatedMatch.team1.name,
        team2Name: updatedMatch.team2.name,
        divisionName: updatedMatch.division.name,
        scoreTeam1: updatedMatch.scoreTeam1,
        scoreTeam2: updatedMatch.scoreTeam2,
        time: updatedMatch.time,
        status: updatedMatch.status,
      };

      io.emit('scoreUpdated', adaptedMatch);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du score du match:', error);
    }
  });

  socket.on('matchStatusChanged', async (statusData) => {
    try {

      const updatedMatch = await Match.updateMatchStatus(statusData._id, statusData.status);


      if (!updatedMatch) {
        throw new Error('Match not found after status update');
      }


      io.emit('matchStatusUpdated', {
        _id: updatedMatch._id,
        team1Logo: updatedMatch.team1.logo,
        team2Logo: updatedMatch.team2.logo,
        team1Name: updatedMatch.team1.name,
        team2Name: updatedMatch.team2.name,
        divisionName: updatedMatch.division.name,
        scoreTeam1: updatedMatch.scoreTeam1,
        scoreTeam2: updatedMatch.scoreTeam2,
        time: updatedMatch.time,
        status: updatedMatch.status,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du match:', error);
    }
  });


  socket.on('cardUpdated', (cardData) => {
    console.log('Mise à jour des cartons', cardData);

    io.emit('cardStatusUpdated', cardData);
  });



  socket.on('update-match-score', async (matchId) => {
    try {
      const match = await Match.findById(matchId)
        .populate({ path: 'team1', populate: ['players', 'subtitutes'] })
        .populate({ path: 'team2', populate: ['players', 'subtitutes'] })
        .populate({ path: 'events', populate: ['player', 'substitute'] })
        .populate('division');

      if (!match) {
        throw new Error('Match not found');
      }

      io.emit('matchScoreUpdated', match);
    } catch (error) {
      console.error('Error updating match score:', error);
    }
  });


  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté');
  });
});



app.get('/', (req, res) => {
  res.send("Le serveur Express et Socket.io est opérationnel !");
});




connectToDatabase()

app.use('/images', express.static('images'))



server.listen(3002, () => {
  console.log('Le serveur HTTP et Socket.io sont en écoute sur le port 3002');
});

app.listen(3001, () => {
  console.log(' app is working on port 3001');
});



