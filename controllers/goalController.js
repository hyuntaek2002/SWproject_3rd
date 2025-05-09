const db = require('../models/db');

//목표저장
exports.saveGoal = (req, res) => {
  const { user_id, month, amount } = req.body;

  if (!user_id || !month || !amount) {
    return res.status(400).json({ message: 'user_id, month, amount는 필수입니다.' });
  }

  const sql = `
    INSERT INTO goals (user_id, month, amount)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE amount = VALUES(amount)
  `;

  db.query(sql, [user_id, month, amount], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: '목표 지출 금액이 저장되었습니다.' });
  });
};

exports.getGoal = (req, res) => {
    const { user_id, month } = req.query;
  
    if (!user_id || !month) {
      return res.status(400).json({ message: 'user_id, month는 필수입니다.' });
    }
  
    const sql = `SELECT amount FROM goals WHERE user_id = ? AND month = ?`;
  
    db.query(sql, [user_id, month], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
  
      if (results.length === 0) {
        return res.status(404).json({ message: '해당 월의 목표가 없습니다.' });
      }
  
      res.status(200).json({ amount: results[0].amount });
    });
  };
  