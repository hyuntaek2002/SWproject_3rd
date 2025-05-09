import axios from './axiosInstance';

// 목표 저장/조회
export const saveGoal = data => axios.post('/goals', data);
export const getGoal  = params => axios.get('/goals', { params });
