const express = require('express');
const router = express.Router();

// authMiddleware.js에서 module.exports = authenticateToken; 로 내보낸 함수를
// 구조분해가 아닌 변수에 직접 할당합니다.
const authenticateToken = require('../middleware/authMiddleware');

// 컨트롤러 함수는 그대로 구조분해로 가져옵니다.
const { getCoinRecommendations } = require('../controllers/coinController');

// 추천 코인 요청
router.get('/recommendations', authenticateToken, getCoinRecommendations);

module.exports = router;
