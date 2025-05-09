// routes/surveyRoutes.js

const express = require('express');
const router = express.Router();

// 컨트롤러 함수 — 이 부분은 실제 이름에 맞게 조정하세요
const { submitSurvey } = require('../controllers/surveyController');

// authMiddleware.js에서 module.exports = authenticateToken; 로 내보냈다면
// require() 자체가 함수가 됩니다.
const authenticate = require('../middleware/authMiddleware');

// POST /api/surveys
router.post('/', authenticate, submitSurvey);

module.exports = router;
