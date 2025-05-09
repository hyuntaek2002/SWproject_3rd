const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// 설문 저장
router.post('/survey', authenticateToken, surveyController.submitSurvey)

// 주식 추천
router.get('/recommendations', authenticateToken, surveyController.getRecommendations)

module.exports = router
