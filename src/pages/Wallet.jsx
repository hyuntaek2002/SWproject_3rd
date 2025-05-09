import { useEffect, useState } from 'react';
import { BrowserProvider } from 'ethers'; // ✅ ethers v6에서 Web3Provider 대신 BrowserProvider
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

function Wallet() {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // 지갑 계정 요청
        const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAddress(account);

        // ethers v6 방식으로 provider 생성
        const provider = new BrowserProvider(window.ethereum);

        // 잔액 조회
        const balanceBigInt = await provider.getBalance(account);
        const balanceEth = Number(balanceBigInt) / 1e18;
        setBalance(balanceEth.toFixed(4));

        // 백엔드에 지갑 주소 전송
        const token = localStorage.getItem('token');
        const res = await axios.post('/wallet', { address: account }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMessage(res.data.message || '지갑 연결 성공!');
      } catch (err) {
        console.error('지갑 연결 오류:', err);
        setMessage(`지갑 연결에 실패했습니다. (${err.message})`);
      }
    } else {
      alert('MetaMask가 설치되어 있지 않습니다.');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <button onClick={() => navigate('/dashboard')}>← 대시보드로</button>
      <h2>지갑 연결</h2>

      <p><strong>지갑 주소:</strong> {address || '연결되지 않음'}</p>

      {balance !== null && (
        <p><strong>잔액:</strong> {balance} ETH</p>
      )}

      <button onClick={connectWallet}>MetaMask 연결</button>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Wallet;
