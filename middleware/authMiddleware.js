const jwt = require('jsonwebtoken');
require('dotenv').config();

// 인증 토큰 검증 미들웨어 (기존 로직 그대로 유지)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '인증 토큰이 없습니다.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT 검증 실패:', err.message);
      return res.status(403).json({ message: '토큰이 유효하지 않습니다.' });
    }

    req.user = user;
    next();
  });
}

// ✅ module.exports 로 함수 자체를 내보냅니다
module.exports = authenticateToken;
