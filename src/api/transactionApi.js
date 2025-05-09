import axios from './axiosInstance';

// 거래 CRUD
export const createTransaction    = data => axios.post('/transactions', data);
export const getTransactions      = params => axios.get('/transactions',   { params });
export const updateTransaction    = (id, data) => axios.put(`/transactions/${id}`, data);
export const deleteTransaction    = id => axios.delete(`/transactions/${id}`);

// 월별 통계·요약
export const getMonthlyStatistics = params => axios.get('/transactions/statistics',      { params });
export const getMonthlySummary    = params => axios.get('/transactions/summary',         { params });

// 검색·카테고리별
export const searchTransactions    = params => axios.get('/transactions/search',         { params });
export const getCategoryStatistics= params => axios.get('/transactions/category-statistics',{ params });

// 카테고리별 GPT 요약
export const getCategorySummary   = params => axios.get('/transactions/category-summary',   { params });

// 고정지출
export const getFixedExpenses     = params => axios.get('/transactions/fixed',           { params });
export const getManualFixed       = params => axios.get('/transactions/fixed/manual',    { params });
export const toggleFixedStatus    = (id, body) => axios.patch(`/transactions/${id}/fixed`, body);

// 월별 누적 비교
export const getMonthlyComparison = params => axios.get('/transactions/monthly-comparison',{ params });
