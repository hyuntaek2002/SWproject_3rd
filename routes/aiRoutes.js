const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// GPT 피드백 요청 API
router.post('/spending-feedback', aiController.getSpendingFeedback);
router.post('/monthly-feedback', aiController.getMonthlyFeedback);
//지출 통계 분석API
router.post('/predict-spending', aiController.predictSpending);
//목표설정 API
router.post('/goal-feedback', aiController.generateGoalFeedback);

module.exports = router;
