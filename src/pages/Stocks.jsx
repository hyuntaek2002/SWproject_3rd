// src/pages/Stocks.jsx
import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

function Stocks() {
  const [recommendations, setRecommendations] = useState([]);
  const [risk, setRisk] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await axios.get('/stocks/recommend', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('API 응답', res.data);

        const { riskTolerance, investmentGoal, recommendations } = res.data;

        if (recommendations && recommendations.length) {
          setRecommendations(recommendations);
          setRisk(riskTolerance);
          setGoal(investmentGoal);
        } else {
          setError('추천할 주식이 충분하지 않습니다.');
        }
      } catch (err) {
        console.error('주식 추천 오류:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('추천 주식을 불러오지 못했습니다.');
        }
      }
    };

    fetchRecommendations();
  }, [navigate]);

  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-4 px-3 py-1 border rounded hover:bg-gray-100"
      >
        ← 돌아가기
      </button>

      <h2 className="text-2xl font-bold mb-4">추천 주식 목록</h2>

      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <p className="mb-2">
            당신의 투자 성향: <strong>{risk}</strong>
          </p>
          <p className="mb-4">
            투자 목표: <strong>{goal}</strong>
          </p>

          <ul className="list-disc pl-5 space-y-2">
            {recommendations.map((stock, idx) => (
              <li key={idx}>
                {stock.symbol} – 현재가: ${stock.latestClose} ({stock.changePercent}%)
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default Stocks;
