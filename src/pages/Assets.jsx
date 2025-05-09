import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

function Assets() {
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  


  useEffect(() => {
    const fetchAssets = async () => {
      const token = localStorage.getItem('token');

      try {
        const res = await axios.get('/assets', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.assets && res.data.assets.length > 0) {
          setAssets(res.data.assets);
          setTotal(res.data.total);
        } else {
          setMessage(res.data.message || '보유 자산이 없습니다.');
        }
      } catch (err) {
        console.error('자산 불러오기 오류:', err);
        setMessage('자산 정보를 불러오지 못했습니다.');
      }
    };

    fetchAssets();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <button onClick={() => navigate('/dashboard')}>← 대시보드로</button>
      <h2>보유 자산 목록</h2>
      {message && <p>{message}</p>}
      {assets.length > 0 && (
        <>
          <ul>
            {assets.map((asset, idx) => (
              <li key={idx}>
                {asset.name} ({asset.symbol.toUpperCase()}) - 수량: {asset.quantity}개, 
                현재가: ${asset.current_price.toLocaleString()}, 
                평가금액: ${asset.value.toLocaleString()}
              </li>
            ))}
          </ul>
          <h3>총 자산 평가액: ${total.toLocaleString()}</h3>
        </>
      )}
    </div>
  );
}

export default Assets;
