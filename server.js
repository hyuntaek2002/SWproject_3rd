const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// 라우터 불러오기
const authRoutes = require('./routes/authRoutes');
const surveyRoutes = require('./routes/surveyRoutes');
const walletRoutes = require('./routes/walletRoutes');
const blockchainRoutes = require('./routes/blockchainRoutes');
const transactionRoutes = require('./routes/transactionRoutes'); // 여기부터 추가
const aiRoutes = require('./routes/aiRoutes');
const goalRoutes = require('./routes/goalRoutes');

// 라우터 등록
app.use('/api/auth', authRoutes);
app.use('/api/survey', surveyRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/transactions', transactionRoutes); //  여기부터 추가
app.use('/api/ai', aiRoutes);
app.use('/api/goals', goalRoutes);

app.get('/', (req, res) => {
    res.send('서버가 정상적으로 동작합니다.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}번에서 실행 중입니다.`);
});
