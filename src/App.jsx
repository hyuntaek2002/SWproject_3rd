// App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Wallet from './pages/Wallet';
import Balance from './pages/Balance';
import Dashboard from './pages/Dashboard';
import Survey from './pages/Survey';
import Stocks from './pages/Stocks';
import Coin from './pages/Coin';
import Assets from './pages/Assets'; // 자산 페이지
import Calendar  from './pages/Calendar';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signup" />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/balance" element={<Balance />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/survey" element={<Survey />} />
      <Route path="/stocks" element={<Stocks />} />
      <Route path="/coin" element={<Coin />} />
      <Route path="/assets" element={<Assets />} />
      <Route path="/calendar"  element={<Calendar />} />
    </Routes>
  );
}

export default App;
