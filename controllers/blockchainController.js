const {
    getCurrentBlock,
    getWalletBalance
  } = require('../services/blockchainService');
  const db = require('../models/db');
  
  // 블록 번호 조회 함수 (기존 로직 그대로 유지)
  exports.getBlockNumber = async (req, res) => {
    try {
      const block = await getCurrentBlock();
      res.status(200).json({ blockNumber: block });
    } catch (err) {
      console.error('블록 번호 조회 실패:', err);
      res.status(500).json({ message: '블록 번호 조회 실패' });
    }
  };
  
  // 내 지갑 잔액 조회 함수 (새로 추가)
  exports.getMyWalletBalance = (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: '사용자 정보가 없습니다.' });
    }
  
    const sql = 'SELECT wallet_address FROM users WHERE id = ?';
    db.query(sql, [userId], async (err, results) => {
      if (err) {
        console.error('DB 조회 오류:', err);
        return res.status(500).json({ message: 'DB 조회 오류' });
      }
      if (results.length === 0 || !results[0].wallet_address) {
        return res.status(404).json({ message: '지갑 주소가 없습니다.' });
      }
  
      try {
        const balance = await getWalletBalance(results[0].wallet_address);
        res.status(200).json({ balance });
      } catch (serviceErr) {
        console.error('잔액 조회 실패:', serviceErr);
        res.status(500).json({ message: '잔액 조회 실패' });
      }
    });
  };
  


exports.getMyWalletBalance = (req, res) => {
    const userId = req.user.userId;

    const sql = 'SELECT wallet_address FROM users WHERE id = ?';
    db.query(sql, [userId], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: '지갑 주소가 없습니다.' });
        }

        const wallet = results[0].wallet_address;
        if (!wallet) {
            return res.status(400).json({ message: '등록된 지갑 주소가 없습니다.' });
        }

        try {
            const balance = await getWalletBalance(wallet);
            res.status(200).json({ wallet_address: wallet, balance: `${balance} ETH` });
        } catch {
            res.status(500).json({ message: '잔액 조회 실패' });
        }
    });
};
