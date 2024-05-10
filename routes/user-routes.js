const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Match = require('../models/Match');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const mongoose = require('mongoose');



const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'doris2@ethereal.email',
    pass: '3WgFvR8JZXbJJW5rMw'
  }
});



router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  console.log(email);


  const resetToken = "GENERATE_RESET_TOKEN_HERE";
  const resetPasswordUrl = `http://localhost:3011/metronic8/react/demo1/auth/SetPassword/${email}`;


  let mailOptions = {
    from: '"Expéditeur" <info@ethereal.email>',
    to: 'doris2@ethereal.email',
    subject: 'Reset Password Link',
    text: `Please click on the following link to reset your password: ${resetPasswordUrl}`,
    html: `<p>Please click on the following link to reset your password: <a href="${resetPasswordUrl}">${resetPasswordUrl}</a></p>`,
  };



  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ error: 'Error sending email' });
    } else {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info)); // URL pour visualiser l'e-mail sur Ethereal
      return res.status(200).json({ message: 'Email sent successfully', preview: nodemailer.getTestMessageUrl(info) });
    }
  });
});


router.put('/change-password/:email', async (req, res) => {
  const { email } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;

    await user.save();

    res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Une erreur est survenue' });
  }
});


router.put('/ban/:id', async (req, res) => {
  try {
    const userId = req.params.id;


    const updatedUser = await User.findByIdAndUpdate(userId, { status: 'banned' }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User has been banned successfully', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.put('/activate/:id', async (req, res) => {
  try {
    const userId = req.params.id;


    const updatedUser = await User.findByIdAndUpdate(userId, { status: 'active' }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User has been activated successfully', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});







router.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs", error: error.message });
  }
});



//const CLIENT_ID = "430621675041-97e4t4mj4t67jv4ror7d733sbju6di8l.apps.googleusercontent.com";
//const client = new OAuth2Client(CLIENT_ID);


router.post('/register', async (req, res) => {

  try {
    const { email, first_name, last_name, password, password_confirmation } = req.body;

    if (!email || !first_name || !last_name || !password || !password_confirmation) {
      return res.status(400).json({ error: 'All registration fields are required' });
    }


    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }


    if (password !== password_confirmation) {
      return res.status(400).json({ error: 'Password and confirmation do not match' });
    }


    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = new User({ email, first_name, last_name, password: hashedPassword });


    user.role = 'creator';
    user.status = 'active';

    await user.save();

    // Generate JWT token
    const api_token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully', api_token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



const authenticateAgent = (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    const decoded = jwt.verify(token, 'your-secret-key'); // Replace 'your-secret-key' with your actual secret key
    req.agentId = decoded.userId;
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
};

// GET endpoint to fetch the match associated with the agent
router.get('/agent/match', authenticateAgent, async (req, res) => {
  try {
    // Find the agent by ID extracted from the token
    const agent = await User.findById(req.agentId);
    if (!agent) {
      return res.status(404).send('Agent not found.');
    }

    // Check if the agent is associated with any matches
    if (!agent.match || agent.match.length === 0) {
      return res.status(404).send('No matches associated with this agent.');
    }

    // Retrieve and populate the details for all matches associated with the agent
    const matches = await Match.find({ '_id': { $in: agent.match } })
      .populate({
        path: 'team1',
        populate: {
          path: 'players', // Assuming 'players' are directly under 'team' in the team schema
        }
      })
      .populate({
        path: 'team2',
        populate: {
          path: 'players', // Assuming same structure for team2
        }
      })
      .populate('division') // Populates only the 'division' from the Division model
      .populate('events', 'description type') // Example: Populating 'events' with selected fields
      .populate('winner', 'name logo') // Assuming 'winner' is a 'team'
      .populate('loser', 'name logo'); // Assuming 'loser' is a 'team'

    if (!matches || matches.length === 0) {
      return res.status(404).send('Matches not found.');
    }

    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});





router.post('/registerAgent', async (req, res) => {
  try {
    const { email, password, matchId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (matchId && !mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ error: 'Invalid matchId.' });
    }

    const existingUser = await User.findOne({ email });

    let match = null;
    if (matchId) {
      match = await Match.findById(matchId);
      if (!match) {
        return res.status(404).json({ error: 'Match not found.' });
      }
    }

    if (existingUser) {
      // User exists, so update their matches array
      if (match) {
        existingUser.match = existingUser.match || [];
        existingUser.match.push(match._id);
        await existingUser.save();
      }
      return res.status(200).json({ message: 'Existing agent updated successfully.' });
    } else {
      // No existing user, so create a new user
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = new User({
        email,
        password: hashedPassword,
        role: 'agent',
        status: 'active',
        match: match ? [match._id] : []
      });

      await newUser.save();

      // Create and assign a new JWT token for the newly registered agent
      const api_token = jwt.sign({ userId: newUser._id }, 'your-secret-key', { expiresIn: '1h' });

      // Mail sending logic remains unchanged
      let mailOptions = {
        from: '"Expéditeur" <info@ethereal.email>',
        to: email, // Dynamically send to the registered email
        subject: 'Votre compte agent a été créé',
        text: `Votre compte a été créé avec succès. Voici vos informations de connexion : Email: ${email}`, // Do not send passwords via email
        html: `<p>Votre compte a été créé avec succès. Voici vos informations de connexion :</p><p>Email: ${email}</p>`, // Do not send passwords via email
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return res.status(500).json({ error: 'Error sending email' });
        } else {
          console.log('Email sent successfully');
        }
      });

      return res.status(201).json({ message: 'New agent registered successfully', api_token });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});






router.post('/registergoogle', async (req, res) => {
  const { email, first_name, last_name, password, password_confirmation, googleToken } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    if (googleToken) {

      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: "430621675041-97e4t4mj4t67jv4ror7d733sbju6di8l.apps.googleusercontent.com",
      });
      const payload = ticket.getPayload();

      const newUser = new User({
        email: payload['email'],
        first_name,
        last_name,
        role: 'creator',
        status: 'active',

      });
      await newUser.save();



    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


async function verifyToken(tokenId) {
  const ticket = await client.verifyIdToken({
    idToken: tokenId,
    audience: "430621675041-97e4t4mj4t67jv4ror7d733sbju6di8l.apps.googleusercontent.com",
  });
  return ticket.getPayload();
}


async function findUserByEmail(email) {
  return await User.findOne({ email: email });
}


function generateSessionTokenForUser(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
    },
    'your-secret-key',
    {
      expiresIn: '1h',
    }
  );
}


const CLIENT_ID = "430621675041-97e4t4mj4t67jv4ror7d733sbju6di8l.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:3011"; // Remplacez par votre URI de redirection réelle

const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

router.post('/google-login', async (req, res) => {
  const { code } = req.body;

  try {
    // Échange du code d'autorisation contre un jeton d'accès et un jeton d'ID
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Vérification du jeton d'ID pour obtenir le payload
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // Logique pour trouver ou créer un utilisateur dans votre base de données
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = new User({
        email: payload.email,
        name: payload.name,
        role: 'creator',
        status: 'active',
        // Autres champs nécessaires...
      });
      try {
        await user.save();
        console.log("Nouvel utilisateur créé:", user);
      } catch (error) {
        console.error("Erreur lors de la création de l'utilisateur:", error);
        return res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
      }


    }

    // Génération d'un jeton pour l'utilisateur
    const userToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      'your-secret-key', // Remplacez par votre clé secrète
      {
        expiresIn: '1h',
      }
    );

    // Réponse au client
    res.json({ token: userToken, user: { email: user.email, role: user.role } });
  } catch (error) {
    console.error('Error during the authorization code exchange', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});










router.post('/login', async (req, res) => {
  try {

    const { email, password } = req.body;


    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }


    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }


    if (user.status === 'banned') {
      return res.status(403).json({ error: 'You are banned' });
    }


    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Authentication failed' });
    }


    const api_token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      'your-secret-key',
      {
        expiresIn: '1h',
      }
    );


    res.status(200).json({ message: 'Sign-in successful', api_token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.post('/verify_token', async (req, res) => {
  try {
    const { api_token } = req.body;


    if (!api_token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify the token
    jwt.verify(api_token, 'your-secret-key', async (err, decoded) => {
      if (err) {
        console.error("token not valid");
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Fetch user data based on the decoded token
      const user = await User.findById(decoded.userId);

      if (!user) {
        console.log("User not found")
        return res.status(404).json({ error: 'User not found' });

      }

      // Return user data
      res.status(200).json(user);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;


