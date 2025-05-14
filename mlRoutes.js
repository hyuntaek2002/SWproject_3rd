const express = require('express');
const router = express.Router();
const mlController = require('../controllers/ml_prediction');

router.post('/predict-spending', mlController.predictSpendingML);

module.exports = router;
