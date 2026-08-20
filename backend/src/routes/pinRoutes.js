const express = require('express');
const { createPin, deletePin, getPins } = require('../controllers/pinController');

const router = express.Router();

router.get('/', getPins);
router.post('/', createPin);
router.delete('/:id', deletePin);

module.exports = router;

