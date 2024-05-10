const express = require('express');
const router = express.Router();
const Contact = require('../models/contact');


router.post('/addcontacts', async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Error creating contact' });
  }
});

router.get('/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Error getting contacts' });
  }
});
// Route to delete a contact
router.delete('/contacts/:id', async (req, res) => {
    try {
      const contact = await Contact.findOneAndDelete(req.params.id);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      res.status(200).json({ message: 'Contact deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting contact' });
    }
  });

module.exports = router;