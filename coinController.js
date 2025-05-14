const db = require('../models/db');
const { getCoinMarketData } = require('../services/coinService');

exports.getCoinRecommendations = async (req, res) => {
  const userId = req.user.userId;

  // 최신 설문 결과 조회
  const sql = 'SELECT * FROM survey_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1';
  db.query(sql, [userId], async (err, results) => {
    if (err) {
      console.error('설문조사 결과 조회 오류:', err);
      return res.status(500).json({ message: '서버 오류 (설문조사 조회 실패)' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: '설문조사를 먼저 완료해주세요.' });
    }

    const survey = results[0];
    const allCoins = await getCoinMarketData(100);

    if (!allCoins || allCoins.length === 0) {
      return res.status(500).json({ message: '코인 데이터를 가져오지 못했습니다.' });
    }

    // 변동률 기준 정렬
    const sortedCoins = allCoins
      .filter(c => c.price_change_percentage_24h !== null)
      .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);

    const oneThird = Math.ceil(sortedCoins.length / 3);
    const attackType  = sortedCoins.slice(0, oneThird);
    const neutralType = sortedCoins.slice(oneThird, oneThird * 2);
    const stableType  = sortedCoins.slice(oneThird * 2);

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
    }

    // 최소 개수 보장
    if (recommended.length < 3) {
      recommended = sortedCoins.slice(0, 10);
    }

    res.status(200).json({
      message: '추천 코인 목록',
      risk_tolerance:   survey.risk_tolerance,
      investment_goal:  survey.investment_goal,
      recommendations:  recommended.slice(0, 10)
    });
  });
};
