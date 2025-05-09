const db = require('../models/db');
const { getMultipleStockData } = require('../services/stockService');

// 설문 결과 저장
exports.submitSurvey = (req, res) => {
  const { risk_tolerance, investment_goal } = req.body;
  const userId = req.user?.userId;

  if (!risk_tolerance || !investment_goal || !userId) {
    return res.status(400).json({ message: '입력값이 부족합니다.' });
  }

  const sql = 'INSERT INTO survey_results (user_id, risk_tolerance, investment_goal) VALUES (?, ?, ?)';
  db.query(sql, [userId, risk_tolerance, investment_goal], (err, result) => {
    if (err) {
      console.error('설문 저장 실패:', err);
      return res.status(500).json({ message: '서버 오류' });
    }
    res.status(201).json({ message: '설문 저장 성공!' });
  });
};

// 추천 주식 응답
exports.getRecommendations = async (req, res) => {
  const userId = req.user.userId;

  const sql = 'SELECT * FROM survey_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1';
  db.query(sql, [userId], async (err, results) => {
    if (err) {
      console.error('설문조사 결과 조회 실패:', err);
      return res.status(500).json({ message: '서버 오류 (설문조사 조회 실패)' });
    }

    if (results.length === 0) {
      console.warn('설문조사 결과 없음:', userId);
      return res.status(404).json({ message: '설문조사 결과가 없습니다.' });
    }

    const survey = results[0];
    console.log('설문 결과:', survey);

    let allStockData = [];
    try {
      allStockData = await getMultipleStockData();
    } catch (error) {
      console.error('주식 데이터 가져오기 실패:', error);
      return res.status(500).json({ message: '주식 데이터 가져오기 실패' });
    }

    if (!Array.isArray(allStockData) || allStockData.length === 0) {
      return res.status(500).json({ message: '추천할 주식이 충분하지 않습니다.' });
    }

    const sortedByChange = allStockData.sort((a, b) => b.changePercent - a.changePercent);
    const top = Math.ceil(sortedByChange.length / 3);

    const attackType = sortedByChange.slice(0, top);
    const neutralType = sortedByChange.slice(top, top * 2);
    const stableType = sortedByChange.slice(top * 2);

    let recommended = [];

    switch (survey.risk_tolerance) {
      case '공격형':
        recommended = attackType;
        break;
      case '중립형':
        recommended = neutralType;
        break;
      case '안정형':
        recommended = stableType;
        break;
      default:
        recommended = sortedByChange;
    }

    if (recommended.length < 3) {
      recommended = sortedByChange.slice(0, 10);
    }

    res.status(200).json({
      message: '실시간 추천 주식 목록',
      investment_goal: survey.investment_goal,
      risk_tolerance: survey.risk_tolerance,
      recommendations: recommended.slice(0, 10)
    });
  });
};
