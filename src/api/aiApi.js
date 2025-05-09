import axios from './axiosInstance';

// 소비 피드백
export const spendingFeedback = body =>
  axios.post('/ai/spending-feedback', body);

// 월별 비교 + 피드백
export const monthlyFeedback = params =>
  axios.post('/ai/monthly-feedback', null, { params });

// 지출 예측
export const predictSpending = body =>
  axios.post('/ai/predict-spending', body);

// 목표 대비 피드백
export const goalFeedback    = body =>
  axios.post('/ai/goal-feedback', body);
