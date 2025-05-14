// server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app     = express();

// CORS & body-parser 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 스케줄러 실행 (최초 한 번)
const fetchAndSaveStockData = require('./services/stockScheduler');
fetchAndSaveStockData();

// 라우터 불러오기
const authRoutes        = require('./routes/authRoutes');
const surveyRoutes      = require('./routes/surveyRoutes');
const walletRoutes      = require('./routes/walletRoutes');
const blockchainRoutes  = require('./routes/blockchainRoutes');
const stockRoutes       = require('./routes/stockRoutes');
const coinRoutes        = require('./routes/coinRoutes');
const assetRoutes       = require('./routes/assetRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const aiRoutes          = require('./routes/aiRoutes');
const goalRoutes        = require('./routes/goalRoutes');
const mlRoutes          = require('./routes/mlRoutes'); //ML 추가
// 라우터 등록
app.use('/api/auth',         authRoutes);
app.use('/api/survey',       surveyRoutes);
app.use('/api/wallet',       walletRoutes);
app.use('/api/blockchain',   blockchainRoutes);
app.use('/api/stocks',       stockRoutes);
app.use('/api/coin',         coinRoutes);
app.use('/api/assets',       assetRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ai',           aiRoutes);
app.use('/api/goals',        goalRoutes);
app.use('/api/ml',           mlRoutes);//ML 추가

// 헬스체크용 기본 루트
app.get('/', (req, res) => {
  res.send('서버가 정상적으로 동작합니다.');
});

// 서버 실행
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}번에서 실행 중입니다.`);
});
