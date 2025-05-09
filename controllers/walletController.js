const db = require('../models/db');

exports.saveWalletAddress = (req, res) => {
  const userId = req.user?.userId;
  const { address } = req.body;

  if (!userId || !address) {
    return res.status(400).json({ message: '지갑 주소 또는 사용자 정보 누락' });
  }

  const sql = 'UPDATE users SET wallet_address = ? WHERE id = ?';
  db.query(sql, [address, userId], (err) => {
    if (err) {
      console.error('지갑 주소 저장 실패:', err);
      return res.status(500).json({ message: '서버 오류' });
    }

    res.status(200).json({ message: '지갑 주소 저장 완료' });
  });
};
