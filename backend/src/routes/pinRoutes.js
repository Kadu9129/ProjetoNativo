const express = require('express');
const { createPin, deletePin, getPins, updatePin } = require('../controllers/pinController');

const router = express.Router();

router.get('/', getPins);
router.post('/', createPin);
router.put('/:id', updatePin);
router.delete('/:id', deletePin);

module.exports = router;

