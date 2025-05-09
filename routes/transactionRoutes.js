// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const aiController = require('../controllers/aiController');

// 거래 등록
router.post('/', transactionController.createTransaction);
// 거래 목록 조회 (전체 or 월별)
router.get('/', transactionController.getTransactions);
//거래수정정
router.put('/:id', transactionController.updateTransaction);
//거래삭제제
router.delete('/:id', transactionController.deleteTransaction);
// 거래 통계 조회 (월별 수입/지출 합계)
router.get('/statistics', transactionController.getMonthlyStatistics);
//거래 총합
router.get('/summary', transactionController.getMonthlySummary);
//메모검색 기능
router.get('/search', transactionController.searchTransactions);
//카테고리 별 지출 통계
router.get('/category-statistics', transactionController.getCategoryStatistics);
// 카테고리별 summary API(GPT)
router.get('/category-summary', transactionController.getCategorySummary);
//월별 요약
router.get('/ai/monthly-feedback', aiController.getMonthlyFeedback);
//고정지출 분석
router.get('/fixed', transactionController.getFixedExpenses);
router.get('/fixed/manual', transactionController.getManuallyFixedExpenses);
//고정 지출 여부 확인
router.patch('/:id/fixed', transactionController.updateFixedStatus);
// 이번 달 vs 저번 달 지출 비교
router.get('/monthly-comparison', transactionController.getMonthlyComparison);

module.exports = router;
