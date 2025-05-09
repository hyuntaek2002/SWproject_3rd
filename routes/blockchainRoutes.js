const express = require('express');
const router = express.Router();
const blockchainController = require('../controllers/blockchainController');

const { getMyWalletBalance } = require('../controllers/blockchainController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/balance', authenticateToken, getMyWalletBalance);


router.get('/block', blockchainController.getBlockNumber);

module.exports = router;
