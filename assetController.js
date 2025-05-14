const db = require('../models/db');
const { getCoinMarketData } = require('../services/coinService');


exports.getAssets = async (req, res) => {
  const userId = req.user.userId;

  const sql = `SELECT symbol, quantity FROM user_assets WHERE user_id = ?`;
  db.query(sql, [userId], async (err, results) => {
    if (err) {
      console.error('자산 조회 오류:', err);
      return res.status(500).json({ message: '서버 오류' });
    }

    if (results.length === 0) {
      return res.status(200).json({ message: '보유 중인 자산이 없습니다.', assets: [], total: 0 });
    }

    const allCoins = await getCoinMarketData(100);
    const portfolio = [];
    let total = 0;

    for (let asset of results) {
      const coin = allCoins.find(c => c.symbol.toLowerCase() === asset.symbol.toLowerCase());

      if (coin) {
        const value = asset.quantity * coin.current_price;
        total += value;

        portfolio.push({
          name: coin.name,
          symbol: coin.symbol,
          quantity: asset.quantity,
          current_price: coin.current_price,
          value: value
        });
      }
    }

    res.status(200).json({
      message: '보유 자산 목록',
      assets: portfolio,
      total: total
    });
  });
};
