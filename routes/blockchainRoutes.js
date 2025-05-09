const express = require('express');
const router = express.Router();

// authMiddleware.js에서 module.exports = authenticateToken; 로 내보낸 함수를 그대로 가져옵니다
const authenticate = require('../middleware/authMiddleware');

// controllers에서 필요한 함수들을 구조분해 할당으로 가져옵니다
const {
  getBlockNumber,
  getMyWalletBalance
} = require('../controllers/blockchainController');

// GET /api/blockchain/balance
router.get('/balance', authenticate, getMyWalletBalance);

// GET /api/blockchain/block
router.get('/block', authenticate, getBlockNumber);

module.exports = router;
