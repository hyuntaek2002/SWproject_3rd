// src/pages/Coin.jsx
import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

function Coin() {
  const [coins, setCoins] = useState([]);  // ✅ 수정: coin → coins
  const [risk, setRisk] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      const token = localStorage.getItem('token');

      try {
        const res = await axios.get('/coin/recommendations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data && res.data.recommendations && res.data.recommendations.length > 0) {
          setCoins(res.data.recommendations);
          setRisk(res.data.risk_tolerance);
          setGoal(res.data.investment_goal);
        } else {
          setError('추천할 코인이 충분하지 않습니다.');
        }

        console.log('추천 응답:', res.data);

      } catch (err) {
        console.error('코인 추천 오류:', err);
        setError('추천 코인을 불러오지 못했습니다.');
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <button onClick={() => navigate('/dashboard')}>← 대시보드로</button>
      <h2>추천 코인 목록</h2>

      {error ? (
        <p>{error}</p>
      ) : (
        <>
          <p>당신의 투자 성향: <strong>{risk}</strong></p>
          <p>투자 목표: <strong>{goal}</strong></p>

          <ul>
            {coins.map((coin, idx) => (
              <li key={idx}>
                {coin.name} ({coin.symbol.toUpperCase()}) - 현재가: ${coin.current_price.toLocaleString()} 
                ({coin.price_change_percentage_24h.toFixed(2)}%)
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default Coin;
