// controllers/stockController.js
const db = require('../models/db');

exports.getRecommendedStocks = (req, res) => {
  const userId = req.user.userId;

  const surveySql = `
    SELECT risk_tolerance, investment_goal
    FROM survey_results
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;
  db.query(surveySql, [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ message: '설문 결과가 없습니다.' });
    }

    const { risk_tolerance, investment_goal } = results[0];

    let orderClause;
    switch (risk_tolerance) {
      case '공격형':
        orderClause = 'ORDER BY change_percent DESC';
        break;
      case '안정형':
        orderClause = 'ORDER BY ABS(change_percent) ASC';
        break;
      default:
        orderClause = 'ORDER BY ABS(change_percent) ASC';
    }

    db.query(`SELECT * FROM stocks ${orderClause} LIMIT 10`, (err, rows) => {
      if (err) {
        console.error('추천 주식 조회 실패:', err);
        return res.status(500).json({ message: '추천 주식 조회 실패' });
      }
      // 여기서 키 이름을 프론트와 동일하게 맞춥니다.
      res.status(200).json({
        message: '추천 주식 목록',
        riskTolerance: risk_tolerance,
        investmentGoal: investment_goal,
        recommendations: rows,
      });
    });
  });
};
