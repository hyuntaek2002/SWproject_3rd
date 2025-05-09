const express = require('express');
const router = express.Router();

// authMiddleware.js 에서 module.exports = authenticateToken; 로 내보낸 함수를 그대로 가져옵니다
const authenticateToken = require('../middleware/authMiddleware');

// controllers/stockController.js 에서 exports.getRecommendedStocks 로 내보낸 함수만 구조분해로 가져옵니다
const { getRecommendedStocks } = require('../controllers/stockController');

// GET /api/stocks/recommend
router.get('/recommend', authenticateToken, getRecommendedStocks);

module.exports = router;
