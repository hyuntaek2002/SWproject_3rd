const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// ✅ 지갑 주소 등록 (이메일 인증 없이 바로)
router.post('/register', authenticateToken, walletController.registerWallet);

module.exports = router;
