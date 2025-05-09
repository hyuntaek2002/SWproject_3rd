import { Routes, Route, Navigate } from 'react-router-dom'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Wallet from './pages/Wallet'
import Balance from './pages/Balance'
import Dashboard from './pages/Dashboard'
import Survey from './pages/Survey'
import Stocks from './pages/Stocks'
import TransactionList from './pages/TransactionList'
import CalendarPage from './pages/CalendarPage';
import StatisticsPage from './pages/StatisticsPage';
import CategoryStatistics from './pages/CategoryStatistics'


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
      <Route path="/transactionlist" element={<TransactionList />} /> 
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/statistics" element={<StatisticsPage />} />
      <Route path="/categorystatistics" element={<CategoryStatistics />} />
    </Routes>
  )
}

export default App
