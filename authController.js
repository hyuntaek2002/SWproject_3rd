// controllers/authController.js

const db       = require('../models/db');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
require('dotenv').config();

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: '이름, 이메일과 비밀번호를 모두 입력하세요.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    db.query(sql, [name, email, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res
            .status(409)
            .json({ message: '이미 사용 중인 이메일입니다.' });
        }
        console.error('회원가입 DB 오류:', err);
        return res.status(500).json({ message: '서버 오류' });
      }

      res.status(201).json({
        message: '회원가입 성공!',
        userId: result.insertId
      });
    });
  } catch (error) {
    console.error('회원가입 처리 중 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: '이메일과 비밀번호를 모두 입력하세요.' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('로그인 DB 조회 오류:', err);
      return res.status(500).json({ message: '서버 오류' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: '가입되지 않은 이메일입니다.' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: '로그인 성공',
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email
      }
    });
  });
};
