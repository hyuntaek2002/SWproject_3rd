// src/pages/Balance.jsx
import { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

function Balance() {
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();


  
  useEffect(() => {
    const fetchBalance = async () => {
      const token = localStorage.getItem('token');

      try {
        const res = await axios.get('/blockchain/balance', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setWalletAddress(res.data.address);
        setBalance(res.data.balance);
      } catch (err) {
        console.error('잔액 조회 오류:', err);
        setError('지갑 잔액을 불러올 수 없습니다.');
      }
    };

    fetchBalance();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <button onClick={() => navigate('/dashboard')}>← 대시보드로</button>
      <h2>지갑 자산 조회</h2>

      {error ? (
        <p>{error}</p>
      ) : (
        <>
          <p><strong>지갑 주소:</strong> {walletAddress}</p>
          <p><strong>이더리움 잔액:</strong> {balance} ETH</p>
        </>
      )}
    </div>
  );
}

export default Balance;
