const express = require('express');
const router = express.Router();
const Player = require('../models/player');
const multer = require('multer');

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const Match = require('../models/Match');
const uuid = require('uuid');



// insert images using multer and save the file path to the database
// Define storage for the files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/'); // store files in 'images' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // generate unique filename
  },
});


const upload = multer({ storage: storage });

router.get('/get-players', async (req, res) => {
  try {
    const players = await Player.find();

    res.status(200).json({ players });
  } catch (error) {
    console.error('Error getting players:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




// router.post('/add', upload.single('avatar'), async (req, res) => {
//   try {
//     console.log('req.body:', req.body);
//     const playerData = req.body;

//     if (req.file && req.file.path) {
//       const inputPath = req.file.path;
//       const formData = new FormData();
//       formData.append('size', 'auto');
//       formData.append('image_file', fs.createReadStream(inputPath), path.basename(inputPath));

//       const response = await axios({
//         method: 'post',
//         url: 'https://api.remove.bg/v1.0/removebg',
//         data: formData,
//         responseType: 'arraybuffer',
//         headers: {
//           ...formData.getHeaders(),
//           'X-Api-Key': 'TCzwMVkjQ78RKyMUAD5xGhAS',
//         },
//         encoding: null
//       });

//       if (response.status != 200) {
//         console.error('Error:', response.status, response.statusText);
//         return res.status(500).json({ error: 'Error removing background' });
//       }

//       const outputPath = 'images/no-bg-' + Date.now() + '.png';
//       fs.writeFileSync(outputPath, response.data);

//       playerData.avatar = outputPath;
//     }

//     const newPlayer = new Player(playerData);

//     await newPlayer.save();

//     res.status(201).json({ message: 'Player saved successfully', player: newPlayer });
//   } catch (error) {
//     console.error('Error saving tournament:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });


// router.post('/add', upload.single('avatar'), async (req, res) => {
//   try {
//     console.log('req.body:', req.body);
//     const playerData = req.body;

//     if (req.file && req.file.path) {
//       const image = req.file;
//       const form = new FormData();
//       form.append('file', fs.createReadStream(image.path));

//       const response = await axios.post("http://localhost:8000/api/remove-bg/", form, {
//         headers: {
//           ...form.getHeaders()
//         },
//         responseType: 'stream'  // Set responseType to 'stream'
//       });

//       const filename = `${uuid.v4()}${path.extname(req.file.originalname)}`;
//       const outputPath = path.join(__dirname, '..', 'images', filename);

//       const writer = fs.createWriteStream(outputPath);
//       response.data.pipe(writer);  // Pipe the response data directly to the writer

//       await new Promise((resolve, reject) => {
//         writer.on('finish', resolve);
//         writer.on('error', reject);
//       });

//       console.log('outputPath:', "/images/" + filename);

//       playerData.avatar = "images/" + filename;
//     }

//     const newPlayer = new Player(playerData);

//     await newPlayer.save();

//     res.status(201).json({ message: 'Player saved successfully', player: newPlayer });
//   } catch (error) {
//     console.error('Error saving player:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

router.post('/add', upload.single('avatar'), async (req, res) => {
  try {
    console.log('req.body:', req.body);
    const playerData = req.body;

    if (req.file && req.file.path) {
      const filename = `${uuid.v4()}${path.extname(req.file.originalname)}`;
      const outputPath = path.join(__dirname, '..', 'images', filename);

      // Move the file to the desired location
      fs.renameSync(req.file.path, outputPath);

      console.log('outputPath:', "/images/" + filename);

      playerData.avatar = "images/" + filename;
    }

    const newPlayer = new Player(playerData);

    await newPlayer.save();

    res.status(201).json({ message: 'Player saved successfully', player: newPlayer });
  } catch (error) {
    console.error('Error saving player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/update/:id', upload.single('avatar'), async (req, res) => {
  try {
    console.log('req.body:', req.body);
    let playerData = req.body;

    if (req.file && req.file.path) {
      const inputPath = req.file.path;
      const formData = new FormData();
      formData.append('size', 'auto');
      formData.append('image_file', fs.createReadStream(inputPath), path.basename(inputPath));

      const response = await axios({
        method: 'post',
        url: 'https://api.remove.bg/v1.0/removebg',
        data: formData,
        responseType: 'arraybuffer',
        headers: {
          ...formData.getHeaders(),
          'X-Api-Key': 'WVMfKJeYk1mi7cCxmgS8EXFn',
        },
        encoding: null
      });

      if (response.status != 200) {
        console.error('Error:', response.status, response.statusText);
        return res.status(500).json({ error: 'Error removing background' });
      }

      const outputPath = 'images/no-bg-' + Date.now() + '.png';
      fs.writeFileSync(outputPath, response.data);

      playerData.avatar = outputPath;
    }

    const updatedPlayer = await Player.findByIdAndUpdate(req.params.id, playerData, { new: true });

    if (!updatedPlayer) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.status(200).json({ message: 'Player updated successfully', player: updatedPlayer });
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.put('/update-player/:id', upload.single('avatar'), async (req, res) => {
  try {
    console.log('req.body:', req.body);
    let playerData = req.body;

    if (req.file && req.file.path) {
      const inputPath = req.file.path;
      playerData.avatar = inputPath;
    }

    const updatedPlayer = await Player.findByIdAndUpdate(req.params.id, playerData, { new: true });

    if (!updatedPlayer) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.status(200).json({ message: 'Player updated successfully', player: updatedPlayer });
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedPlayer = await Player.findByIdAndRemove(req.params.id);

    if (!deletedPlayer) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.status(200).json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/get-player/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    res.json({ player });
  } catch (error) {
    console.error('Error getting player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/patch-player/:id', async (req, res) => {
  try {
    console.log('req.body:', req.body);
    let playerData = req.body;

    const updatedPlayer = await Player.findByIdAndUpdate(req.params.id, playerData, { new: true });

    if (!updatedPlayer) {
      return res.status(404).json({ error: 'Player not found' });
    }
    return res.json(updatedPlayer);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.post('/post-image', upload.single('image'), async (req, res) => {
  try {
    const image = req.file;
    const form = new FormData();
    form.append('file', fs.createReadStream(image.path));

    const response = await axios.post("http://localhost:8000/api/remove-bg/", form, {
      headers: {
        ...form.getHeaders()
      }
    });

    res.sendFile(response.data);
  } catch (error) {
    console.error('Error getting image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;


