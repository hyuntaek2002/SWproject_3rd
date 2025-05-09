const express = require('express');
const router = express.Router();

// 미들웨어는 module.exports 로 내보낸 함수 전체를 require 로 가져옵니다
const authenticateToken = require('../middleware/authMiddleware');

// 컨트롤러 함수 (기존 로직 그대로)
const { saveWalletAddress } = require('../controllers/walletController');

// POST /api/wallet
router.post('/', authenticateToken, saveWalletAddress);


module.exports = router;

