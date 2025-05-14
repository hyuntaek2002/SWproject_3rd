// controllers/surveyController.js
const db = require('../models/db');

exports.saveSurveyResult = (req, res) => {
  const userId = req.user?.userId;
  const answers = req.body;

  if (!userId) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  const riskTolerance = answers.risk_tolerance;

  if (!riskTolerance) {
    return res.status(400).json({ message: 'risk_tolerance 값이 없습니다.' });
  }

  const sql = `
    INSERT INTO survey_results (user_id, risk_tolerance)
    VALUES (?, ?)
  `;

  db.query(sql, [userId, riskTolerance], (err, result) => {
    if (err) {
      console.error('설문 저장 실패:', err);
      return res.status(500).json({ message: '서버 오류', error: err });
    }
    res.status(201).json({ message: '설문 저장 성공!' });
  });
};
