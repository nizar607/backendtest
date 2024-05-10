const express = require('express');
const router = express.Router();
const Tournament = require('../models/tournament');
const multer = require('multer');
const authenticateUser = require('../middleware/AuthenticateUser');
const Division = require('../models/Division');
const mongoose = require('mongoose');





const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});


const upload = multer({ storage: storage });




router.get('/tournamentsAdmin', async (req, res) => {
  try {
    const tournaments = await Tournament.find({});
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des tournois", error: error.message });
  }
});

router.get('/tournamentsOne/:id', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournoi non trouvé" });
    }
    res.json(tournament);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: "ID de tournoi non valide" });
    }
    res.status(500).json({ message: "Erreur lors de la récupération du tournoi", error: error.message });
  }
});



router.get('/tournamentsAdmin/tournament/:tournamentId', async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId;

    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).send("L'ID du tournoi fourni n'est pas valide.");
    }
    const divisions = await Division.find({ tournament: tournamentId }).populate('tournament').populate('teams');
    if (divisions.length === 0) {

      return res.status(404).send("Aucune division trouvée pour cet ID de tournoi.");
    }
    res.json(divisions);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des divisions", error: error.message });
  }
});


router.put('/addcomment/:tournamentId', authenticateUser, async (req, res) => {
  const { tournamentId } = req.params;
  const { comment } = req.body;

  try {

    const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: req.user._id });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found or you do not have permission to edit this tournament.' });
    }


    tournament.comment = comment;


    await tournament.save();

    res.status(200).json({ message: 'Tournament updated successfully', tournament });
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.get('/user-tournaments', authenticateUser, async (req, res) => {
  try {
    const tournaments = await Tournament.find({ createdBy: req.user._id, isApprouved: 'approved' });


    res.status(200).json({ tournaments });
  } catch (error) {
    console.error('Error getting tournaments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


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



router.get('/tournaments/count', async (req, res) => {
  try {

    const count = await Tournament.countDocuments({});


    res.status(200).json({ count });
  } catch (error) {
    console.error('Error counting tournaments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




router.get('/tournament/:id', authenticateUser, async (req, res) => {
  try {
    const tournamentId = req.params.id;

    const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: req.user._id });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.status(200).json({ tournament });
  } catch (error) {
    console.error('Error getting tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.delete('/tournament/:id', authenticateUser, async (req, res) => {
  try {
    const tournamentId = req.params.id;

    const tournament = await Tournament.findOneAndDelete({
      _id: tournamentId,
      createdBy: req.user._id
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournoi non trouvé ou vous n\'êtes pas le propriétaire' });
    }

    await Division.deleteMany({ tournament: tournamentId });

    res.status(200).json({ message: 'Tournoi et ses divisions supprimés avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du tournoi:', error);
    res.status(500).json({ error: 'Erreur du serveur interne' });
  }
});


router.delete('/tournament/:tournamentId/division/:divisionId', authenticateUser, async (req, res) => {
  try {
    const { tournamentId, divisionId } = req.params;


    const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: req.user._id });
    if (!tournament) {
      return res.status(404).json({ error: 'Tournoi non trouvé ou vous n\'avez pas la permission de modifier ce tournoi' });
    }


    const divisionDeleted = await Division.findOneAndDelete({ _id: divisionId, tournament: tournamentId });
    if (!divisionDeleted) {
      return res.status(404).json({ error: 'Division non trouvée ou ne correspond pas au tournoi spécifié' });
    }


    res.status(200).json({ message: 'Division supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la division:', error);
    res.status(500).json({ error: 'Erreur du serveur interne' });
  }
});

















router.post('/add', authenticateUser, upload.single('tournamentLogo'), async (req, res) => {
  try {

    const tournamentData = req.body;
    console.log('req.body:', req.body);


    if (req.file && req.file.path) {
      tournamentData.tournamentLogo = req.file.path;
    }

    const newTournament = new Tournament(tournamentData);
    newTournament.isApprouved = "notApproved";
    await newTournament.save();


    if (typeof tournamentData.divisions === 'string') {
      tournamentData.divisions = tournamentData.divisions.split(',');
    }





    for (const divisionName of tournamentData.divisions) {
      const division = new Division({
        name: divisionName,
        tournament: newTournament._id,
      });
      division.status = 'pending';
      await division.save();
    }

    res.status(201).json({ message: 'Tournament saved successfully', tournament: newTournament });
  } catch (error) {
    console.error('Error saving tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.put('/tournamentstatus/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedTournament = await Tournament.findByIdAndUpdate(id, { isApprouved: 'approved' }, { new: true });
    if (!updatedTournament) {
      return res.status(404).send({ message: 'Tournament not found' });
    }
    res.send(updatedTournament);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});


//? FRONT OFFICE ****************************************************


router.get('/frontoffice/all', async (req, res) => {
  try {
    // get all the tournaments whithout any condition


    const tournaments = await Tournament.find();


    res.status(200).json({ tournaments });
  } catch (error) {
    console.error('Error getting tournaments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//? FRONT OFFICE ****************************************************


module.exports = router;


