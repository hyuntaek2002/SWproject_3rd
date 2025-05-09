const db = require('../models/db');

// 지갑 주소 직접 등록
exports.registerWallet = (req, res) => {
    const { wallet_address } = req.body;
    const userId = req.user.userId;

    if (!wallet_address) {
        return res.status(400).json({ message: '지갑 주소를 입력하세요.' });
    }

    const sql = 'UPDATE users SET wallet_address = ? WHERE id = ?';
    db.query(sql, [wallet_address, userId], (err, result) => {
        if (err) {
            console.error('지갑 주소 저장 실패:', err);
            return res.status(500).json({ message: '서버 오류' });
        }

        res.status(200).json({ message: '지갑 주소가 성공적으로 등록되었습니다.' });
    });
};
