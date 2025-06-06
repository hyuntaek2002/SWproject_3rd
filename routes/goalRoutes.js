const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');

router.post('/', goalController.saveGoal);
router.get('/', goalController.getGoal);

module.exports = router;
