// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage               from './pages/LoginPage';
import RegisterPage            from './pages/RegisterPage';
import ForgotPasswordPage      from './pages/ForgotPasswordPage';
import DashboardPage           from './pages/DashboardPage';
import SurveyPage              from './pages/SurveyPage';
import WalletPage              from './pages/WalletPage';
import CalendarPage            from './pages/CalendarPage';          // ★ 추가
import StocksPage              from './pages/StocksPage';
import CoinRecommendationsPage from './pages/CoinRecommendationsPage';
import AssetsPage              from './pages/AssetsPage';
import ProfilePage             from './pages/ProfilePage';
import NotFoundPage            from './pages/NotFoundPage';

// 보호된 라우트 래퍼
function ProtectedRoute({ element }) {
  const isAuth = !!localStorage.getItem('token');
  return isAuth
    ? element
    : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      {/* 1) 루트 접속 시 무조건 로그인 페이지 */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 2) 공용 페이지 */}
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* 3) 보호된 페이지 */}
      <Route path="/dashboard"            element={<ProtectedRoute element={<DashboardPage />} />} />
      <Route path="/survey"               element={<ProtectedRoute element={<SurveyPage />} />} />
      <Route path="/wallet"               element={<ProtectedRoute element={<WalletPage />} />} />
      <Route path="/calendar"             element={<ProtectedRoute element={<CalendarPage />} />} /> {/* ★ 추가 */}
      <Route path="/stocks"               element={<ProtectedRoute element={<StocksPage />} />} />
      <Route path="/coin-recommendations" element={<ProtectedRoute element={<CoinRecommendationsPage />} />} />
      <Route path="/assets"               element={<ProtectedRoute element={<AssetsPage />} />} />
      <Route path="/profile"              element={<ProtectedRoute element={<ProfilePage />} />} />

      {/* 4) 없는 경로는 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
