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

    // ✅ 숫자형 성향 점수일 경우 처리
    const numericRisk = parseInt(risk_tolerance);
    let orderClause;

    if (numericRisk >= 4) {
      orderClause = 'ORDER BY change_percent DESC'; // 공격형
    } else if (numericRisk <= 2) {
      orderClause = 'ORDER BY ABS(change_percent) ASC'; // 안정형
    } else {
      orderClause = 'ORDER BY change_percent'; // 중립형
    }

    // ✅ 칼럼명 프론트와 일치하도록 alias 적용
    const stockSql = `
      SELECT 
        symbol,
        price AS latestClose,
        change_percent AS changePercent
      FROM stocks
      ${orderClause}
      LIMIT 10
    `;

    db.query(stockSql, (err, rows) => {
      if (err) {
        console.error('추천 주식 조회 실패:', err);
        return res.status(500).json({ message: '추천 주식 조회 실패' });
      }

      res.status(200).json({
        message: '추천 주식 목록',
        riskTolerance: risk_tolerance,
        investmentGoal: investment_goal,
        recommendations: rows,
      });
    });
  });
};
