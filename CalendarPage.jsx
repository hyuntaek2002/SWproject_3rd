import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import {
  BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import 'react-calendar/dist/Calendar.css';
import '../styles/CalendarPage.css';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, PinIcon, BarChartIcon, ActivityIcon } from 'lucide-react';

const CalendarPage = () => {
  // 사용자 ID 추가 - 로그인 시스템에 맞게 수정 필요
  const [user_id] = useState(1); // 기본값으로 1 설정, 실제로는 로그인한 사용자 ID를 가져와야 함
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    type: 'expense',
    category: '',
    amount: '',
    memo: '',
    customCategory: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [summary, setSummary] = useState({ income_total: 0, expense_total: 0 });
  const [searchMemo, setSearchMemo] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [spendingPrediction, setSpendingPrediction] = useState([]);
  const [comparisonData, setComparisonData] = useState({ current: [], previous: [] });
  const [goalAmount, setGoalAmount] = useState(null);
  const [goalFeedback, setGoalFeedback] = useState('');
  const [monthlyTotals, setMonthlyTotals] = useState([]);
  const [predictionMethod, setPredictionMethod] = useState('none');
  // 분석 관련 상태들
  const [categoryStats, setCategoryStats] = useState([]);
  const [spendingFeedback, setSpendingFeedback] = useState('');
  const [monthlyFeedback, setMonthlyFeedback] = useState({
    summary: '',
    feedback: ''
  });
  const [activeTab, setActiveTab] = useState('transactions');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#a4de6c', '#d0ed57', '#8dd1e1'];
  
  const categories = ['식비', '교통•자동차', '편의점•마트•잡화', '쇼핑', '의료', '취미•여가', '생활','주거•통신','급여','이체','교육', '직접입력'];
  
  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');

  // 거래 내역 가져오기
  const fetchTransactions = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/transactions?user_id=${user_id}&month=${year}-${month}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error('거래 내역 가져오기 실패:', error);
      alert('거래 내역을 불러오는데 실패했습니다.');
    }
  };

  // 월별 요약 가져오기
  const fetchSummary = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/summary?user_id=${user_id}&month=${year}-${month}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setSummary(data);
    } catch (error) {
      console.error('월별 요약 가져오기 실패:', error);
      alert('월별 요약을 불러오는데 실패했습니다.');
    }
  };

  // 지출 예측 가져오기
  const fetchPrediction = async () => {
  try {
    // 새로운 머신러닝 API 사용
    const res = await fetch('http://localhost:5000/api/ml/predict-spending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id })
    });
    
    if (!res.ok) {
      // 만약 ML API가 실패하면 fallback으로 기존 GPT API 사용
      console.warn('머신러닝 예측 실패, GPT 예측으로 대체합니다.');
      return fetchGptPrediction();
    }
    
    const data = await res.json();
    
    // 데이터 형식 변환
    const formatted = data.history.map(item => ({
      name: `${parseInt(item.month.split('-')[1])}월`,
      amount: Number(item.total)
    }));
    
    // 예측 결과 추가
    if (data.prediction !== null) {
      formatted.push({ 
        name: '다음달(ML)', 
        amount: data.prediction,
        fill: '#8884d8'  // 특별한 색상으로 표시
      });
    }
    
    setSpendingPrediction(formatted);
    
    // 예측 방식 표시
    setPredictionMethod('machine_learning');
    
  } catch (error) {
    console.error('지출 예측 가져오기 실패:', error);
    // 오류 시 GPT API로 fallback
    fetchGptPrediction();
  }
};

// 기존 GPT 기반 예측 함수 - fallback으로 사용
const fetchGptPrediction = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/ai/predict-spending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id })
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    
    const formatted = data.history.map(item => ({
      name: `${parseInt(item.month.split('-')[1])}월`,
      amount: Number(item.total)
    }));
    
    formatted.push({ 
      name: '다음달(GPT)', 
      amount: data.prediction,
      fill: '#82ca9d'  // GPT 예측은 다른 색상으로 표시
    });
    
    setSpendingPrediction(formatted);
    
    // 예측 방식 표시
    setPredictionMethod('gpt');
    
  } catch (error) {
    console.error('GPT 지출 예측 가져오기 실패:', error);
    // 오류 시 빈 예측 데이터 설정
    setSpendingPrediction([]);
    setPredictionMethod('none');
  }
};

  // 월별 지출 비교 가져오기
  const fetchMonthlyComparison = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/monthly-comparison?user_id=${user_id}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();

      const accumulate = (arr) => {
        let sum = 0;
        return arr.map(d => {
          const amt = Number(d.total);
          sum += isNaN(amt) ? 0 : amt;
          return {
            day: d.day,
            total: sum
          };
        });
      };    
    
      const today = new Date();
      const currentDay = today.getDate();
      const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();

      const currentRaw = accumulate(data.current_data);
      const previousRaw = accumulate(data.previous_data);

      const current = fillMissingDays(currentRaw, currentDay);
      const previous = fillMissingDays(previousRaw, prevMonthLastDay);

      setComparisonData({ current, previous });
    } catch (error) {
      console.error('월별 지출 비교 가져오기 실패:', error);
      setComparisonData({ current: [], previous: [] });
    }
  };

  // 고정 지출 가져오기
  const fetchAllFixedExpenses = async () => {
    try {
      const [autoRes, manualRes] = await Promise.all([
        fetch(`http://localhost:5000/api/transactions/fixed?user_id=${user_id}`),
        fetch(`http://localhost:5000/api/transactions/fixed/manual?user_id=${user_id}`)
      ]);

      if (!autoRes.ok || !manualRes.ok) {
        throw new Error('고정지출 데이터를 가져오는데 실패했습니다.');
      }

      const autoData = await autoRes.json();
      const manualData = await manualRes.json();

      setFixedExpenses([...autoData, ...manualData]);
    } catch (error) {
      console.error('고정지출 불러오기 실패:', error);
      setFixedExpenses([]);
    }
  };

  // 목표 데이터 가져오기
  const fetchGoalData = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/goals?user_id=${user_id}&month=${year}-${month}`);
      if (!res.ok) {
        // 404는 목표가 없는 경우이므로 오류로 처리하지 않음
        if (res.status === 404) {
          setGoalAmount(null);
          setGoalFeedback('');
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setGoalAmount(data.amount);
      fetchGoalFeedback(data.amount);
    } catch (error) {
      console.error('목표 데이터 가져오기 실패:', error);
      setGoalAmount(null);
      setGoalFeedback('');
    }
  };

  // 목표 피드백 가져오기
  const fetchGoalFeedback = async (goal) => {
    try {
      const res = await fetch(`http://localhost:5000/api/ai/goal-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          month: `${year}-${month}`,
          goal
        })
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setGoalFeedback(data.message);
    } catch (error) {
      console.error('목표 피드백 가져오기 실패:', error);
      setGoalFeedback('피드백을 불러오지 못했습니다.');
    }
  };

  // 카테고리별 지출 통계 가져오기
  const fetchCategoryStatistics = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/category-statistics?user_id=${user_id}&month=${year}-${month}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();

      // 차트에 적합한 형태로 데이터 변환
      const formattedData = data.map((item, index) => ({
        name: item.category,
        value: Number(item.total),
        color: COLORS[index % COLORS.length]
      }));

      setCategoryStats(formattedData);
    } catch (error) {
      console.error('카테고리별 통계 가져오기 실패:', error);
      setCategoryStats([]);
    }
  };

  // 카테고리별 소비 습관 피드백 가져오기
  const fetchSpendingFeedback = async () => {
    try {
      // 먼저 카테고리 요약 데이터 가져오기
      const summaryRes = await fetch(`http://localhost:5000/api/transactions/category-summary?user_id=${user_id}&month=${year}-${month}`);
      if (!summaryRes.ok) {
        throw new Error(`HTTP error! status: ${summaryRes.status}`);
      }
      const summaryData = await summaryRes.json();

      // 요약 데이터를 GPT에 전달하여 피드백 받기
      const feedbackRes = await fetch('http://localhost:5000/api/ai/spending-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: summaryData.summary })
      });
      
      if (!feedbackRes.ok) {
        throw new Error(`HTTP error! status: ${feedbackRes.status}`);
      }
      
      const feedbackData = await feedbackRes.json();
      setSpendingFeedback(feedbackData.feedback);
    } catch (error) {
      console.error('소비 습관 피드백 가져오기 실패:', error);
      setSpendingFeedback('피드백을 불러올 수 없습니다.');
    }
  };

  const fetchMonthlyTotals = async () => {
  try {
    // 최근 6개월 데이터를 가져오기 위한 API 호출
    const res = await fetch(`http://localhost:5000/api/transactions/monthly-totals?user_id=${user_id}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    setMonthlyTotals(data.totals);
  } catch (error) {
    console.error('월별 총액 가져오기 실패:', error);
    
    // API 실패 시 더미 데이터 생성
    const now = new Date();
    const dummyData = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleString('default', { month: 'short' });
      const yearMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      
      // 현재 달에 가까울수록 지출이 증가하는 패턴의 더미 데이터 생성
      const baseExpense = 500000 + Math.random() * 300000;
      const expenseVariance = Math.random() * 0.3 - 0.15; // -15%~+15% 변동성
      const expense = Math.round(baseExpense * (1 + i * 0.05 + expenseVariance));
      
      // 수입 데이터도 추가
      const baseIncome = 800000 + Math.random() * 400000;
      const incomeVariance = Math.random() * 0.2 - 0.1; // -10%~+10% 변동성
      const income = Math.round(baseIncome * (1 + i * 0.03 + incomeVariance));
      
      dummyData.push({
        month: monthName,
        yearMonth: yearMonth,
        expense: expense,
        income: income
      });
    }
    
    setMonthlyTotals(dummyData);
  }
};

  // 월별 수입/지출 비교 및 GPT 분석 가져오기
  const fetchMonthlyFeedback = async () => {
  try {
    // API 경로를 올바르게 수정
    const res = await fetch(`http://localhost:5000/api/transactions/ai/monthly-feedback?user_id=${user_id}&month=${year}-${month}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    setMonthlyFeedback({
      summary: data.summary || '',
      feedback: data.feedback || ''
    });
  } catch (error) {
    console.error('월별 피드백 가져오기 실패:', error);
    
    // API 호출 실패 시 대체 데이터 생성
    // 현재 월 데이터 사용
    const currentIncome = Number(summary.income_total || 0);
    const currentExpense = Number(summary.expense_total || 0);
    
    // 지난달 계산
    const prevMonth = new Date();
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    
    // 간단한 대체 데이터
    const summaryText = `
      [이번 달 (${year}-${month})]
      - 수입: ${currentIncome.toLocaleString()}원
      - 지출: ${currentExpense.toLocaleString()}원

      [지난 달 (${prevMonthStr})]
      - 수입: 데이터 없음
      - 지출: 데이터 없음
    `;
    
    // 기본 피드백 메시지
    const feedbackText = '월별 피드백을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    
    setMonthlyFeedback({
      summary: summaryText,
      feedback: feedbackText
    });
    
    console.log("API 오류로 기본 피드백 생성됨");
  }
};

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
    fetchPrediction();
    fetchMonthlyComparison();
    fetchAllFixedExpenses();
    fetchGoalData();
    fetchCategoryStatistics();
    fetchSpendingFeedback();
    fetchMonthlyFeedback();
    fetchMonthlyTotals();
  }, [selectedDate]);

  const handleSubmit = async () => {
    const finalCategory = form.category === '직접입력' ? form.customCategory : form.category;
  
    const body = {
      user_id,
      type: form.type,
      category: finalCategory,
      amount: parseFloat(form.amount),
      memo: form.memo,
      transaction_date: selectedDate.toLocaleDateString('sv-SE'),
    };
  
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId
      ? `http://localhost:5000/api/transactions/${editingId}`
      : `http://localhost:5000/api/transactions`;
  
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
    
      alert(editingId ? '수정 완료!' : '등록 완료!');
      setForm({ type: 'expense', category: '', amount: '', memo: '', customCategory: '' });
      setEditingId(null);
      
      // 모든 데이터 다시 불러오기
      fetchTransactions();
      fetchSummary();
      fetchPrediction();
      fetchCategoryStatistics();
      fetchSpendingFeedback();
      fetchMonthlyFeedback();
    } catch (error) {
      console.error(editingId ? '수정 실패:' : '등록 실패:', error);
      alert(editingId ? '수정 실패' : '등록 실패');
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제할까요?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      alert('삭제 완료!');
      
      // 모든 데이터 다시 불러오기
      fetchTransactions();
      fetchSummary();
      fetchPrediction();
      fetchCategoryStatistics();
      fetchSpendingFeedback();
      fetchMonthlyFeedback();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 실패');
    }
  };
  
  const handleEdit = (tx) => {
    setForm({
      type: tx.type,
      category: categories.includes(tx.category) ? tx.category : '직접입력',
      customCategory: categories.includes(tx.category) ? '' : tx.category,
      amount: tx.amount,
      memo: tx.memo,
    });
    setEditingId(tx.id);
    setSelectedDate(new Date(tx.transaction_date));
  };
  
  const handleSearch = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/search?user_id=${user_id}&memo=${searchMemo}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      console.error('검색 실패:', error);
      alert('검색에 실패했습니다.');
      setSearchResults([]);
    }
  };

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleFixedStatus = async (id, nextStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${id}/fixed`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_fixed: nextStatus }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      alert(nextStatus ? '고정지출로 지정되었습니다.' : '고정지출에서 해제되었습니다.');
      fetchTransactions();
      fetchAllFixedExpenses();
    } catch (err) {
      console.error('고정지출 상태 변경 실패:', err);
      alert('실패했습니다.');
    }
  };
  
  const formatCurrency = (value) => {
    return `${Number(value).toLocaleString()}원`;
  };
  
  const fillMissingDays = (data, endDay) => {
    const result = [];
    let sum = 0;
    for (let i = 1; i <= endDay; i++) {
      const found = data.find(d => d.day === i);
      if (found) {
        sum = found.total;
      }
      result.push({ day: i, total: sum });
    }
    return result;
  };

  // 목표 금액 저장
  const saveGoalAmount = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          month: `${year}-${month}`,
          amount: goalAmount
        })
      });
    
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
    
      alert('목표가 저장되었습니다!');
      fetchGoalData();
    } catch (error) {
      console.error('목표 저장 실패:', error);
      alert('저장에 실패했습니다.');
    }
  };
  
  // 누적에서 마지막 지출 가져오기
  const getLatestSpending = (data) => {
    if (!data || data.length === 0) return 0;
    return data[data.length - 1].total;
  };

  const todaySpending = getLatestSpending(comparisonData.current);
  const lastMonthSpending = getLatestSpending(comparisonData.previous);
  const diff = todaySpending - lastMonthSpending;

  // 날짜별 거래 합계를 표시
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
  
    const ymd = date.toISOString().slice(0, 10);
  
    const daily = transactions.filter(t => {
      const txDate = t.transaction_date?.slice(0, 10); // defensive coding
      return txDate === ymd;
    });
  
    if (daily.length === 0) return null;
  
    const income = daily
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  
    const expense = daily
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  
    return (
      <span className="calendar-daily-amount">
        {income > 0 && <div className="amount-income">+{income.toLocaleString()}원</div>}
        {expense > 0 && <div className="amount-expense">-{expense.toLocaleString()}원</div>}
      </span>
    );
  };

  // 탭 변경 처리 함수
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // 차트 범례 렌더링 함수
  const renderCustomizedLabel = ({ cx, cy, midAngle, /*innerRadius,*/ outerRadius, percent, index, name/*, value*/ }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill={COLORS[index % COLORS.length]}
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <div className="calendar-container">
      <h2>📅 수입/지출 캘린더</h2>
      <Calendar
        onClickDay={setSelectedDate}
        value={selectedDate}
        tileContent={tileContent}
        className="react-calendar"
      />

      {/*총합 금액*/}
      <div className="monthly-summary">
        <div>
          <strong>이번 달 총 수입: </strong> 
          <span className="income-total">{Number(summary.income_total || 0).toLocaleString()}원</span>
        </div>
        <div>
          <strong>이번 달 총 지출: </strong> 
          <span className="expense-total">{Number(summary.expense_total || 0).toLocaleString()}원</span>
        </div>
      </div>

      {/* 탭 네비게이션 - 2개 탭으로 변경 */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => handleTabChange('transactions')}
        >
          <ActivityIcon size={16} />
          거래 내역
        </button>
        <button 
          className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => handleTabChange('analysis')}
        >
          <BarChartIcon size={16} />
          지출 분석
        </button>
      </div>

      {/* 거래 내역 탭 */}
      {activeTab === 'transactions' && (
        <>
          {/*목표 금액 설정*/}
          <div className="goal-section">
            <h3>🎯 이번 달 지출 목표</h3>
            <div className="goal-input">
              <input
                type="number"
                placeholder="예: 500000"
                value={goalAmount || ''}
                onChange={(e) => setGoalAmount(Number(e.target.value))}
              />
              <button onClick={saveGoalAmount}>목표 저장</button>
            </div>

            {goalAmount && (
              <div className="goal-progress-container">
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${
                      summary.expense_total > goalAmount
                        ? 'progress-fill-danger'
                        : (summary.expense_total / goalAmount >= 0.8
                          ? 'progress-fill-warning'
                          : 'progress-fill-safe')
                    }`}
                    style={{ width: `${Math.min(100, (summary.expense_total / goalAmount) * 100)}%` }}
                  />
                </div>
                <div className="progress-stats">
                  <div>누적 지출: {Number(summary.expense_total).toLocaleString()}원</div>
                  <div>목표: {Number(goalAmount).toLocaleString()}원</div>
                </div>
              </div>
            )}
          </div>
      
          {/*메모 검색*/}
          <div className="search-section">
            <h3>🔍 메모로 거래 검색</h3>
            <div className="search-box">
              <input
                type="text"
                placeholder="예: 커피"
                value={searchMemo}
                onChange={(e) => setSearchMemo(e.target.value)}
              />
              <button onClick={handleSearch}>
                <SearchIcon size={16} />
                검색
              </button>
            </div>
          </div>

          {/* 검색 결과 출력 */}
          {searchResults.length > 0 && (
            <div className="search-results">
              <h4>검색 결과:</h4>
              <ul>
                {searchResults.map((t, i) => (
                  <li key={i}>
                    {new Date(t.transaction_date).toLocaleDateString()} - {t.category} - {Math.round(t.amount).toLocaleString()}원 ({t.memo})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <hr />
          <h3>{selectedDate.toLocaleDateString()} 거래 입력</h3>
          <div className="transaction-form">
            <div className="form-row">
              <select name="type" value={form.type} onChange={handleInput}>
                <option value="income">수입</option>
                <option value="expense">지출</option>
              </select>

              {/*  카테고리 선택 드롭다운 */}
              <select name="category" value={form.category} onChange={handleInput} required>
                <option value="">카테고리 선택</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/*  직접입력 입력칸 */}
              {form.category === '직접입력' && (
                <input
                  type="text"
                  name="customCategory"
                  placeholder="카테고리 직접입력"
                  value={form.customCategory}
                  onChange={handleInput}
                  required
                />
              )}
            </div>

            <div className="form-row">
              <input 
                type="number" 
                name="amount" 
                placeholder="금액" 
                value={form.amount} 
                onChange={handleInput} 
              />
              <input 
                type="text" 
                name="memo" 
                placeholder="메모" 
                value={form.memo} 
                onChange={handleInput} 
              />
              <button onClick={handleSubmit}>
                <PlusIcon size={16} />
                등록
              </button>
            </div>
          </div>

          <div className="transaction-list">
            <h3>📋 {selectedDate.toLocaleDateString()} 거래 목록</h3>
            <ul>
              {transactions
                .filter(t => t.transaction_date.startsWith(selectedDate.toISOString().slice(0, 10)))
                .map(tx => (
                  <li key={tx.id}>
                    <div className="transaction-info">
                      <span className={tx.type === 'income' ? 'transaction-income' : 'transaction-expense'}>
                        [{tx.type === 'income' ? '수입' : '지출'}]
                      </span> {tx.category} - 
                      <span className="transaction-amount">
                        {Math.round(tx.amount).toLocaleString()}원
                      </span> ({tx.memo})
                    </div>
                    <div className="transaction-buttons">
                      <button className="button-edit" onClick={() => handleEdit(tx)}>
                        <EditIcon size={14} />
                        수정
                      </button>
                      <button className="button-delete" onClick={() => handleDelete(tx.id)}>
                        <TrashIcon size={14} />
                        삭제
                      </button>
                      <button 
                        className="button-toggle" 
                        onClick={() => toggleFixedStatus(tx.id, !tx.is_fixed)}
                      >
                        <PinIcon size={14} />
                        {tx.is_fixed ? '고정 해제' : '고정 지정'}
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </>
      )}

      {/* 지출 분석 탭 - AI 인사이트와 지출분석을 통합 */}
      {activeTab === 'analysis' && (
        <>
          {/* 목표 지출 분석 */}
          {goalAmount && (
            <div className="ai-insight-section">
              <h3>🎯 목표 지출 분석</h3>
              <div className="ai-insight-card">
                <div className="goal-progress-container">
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${
                        summary.expense_total > goalAmount
                          ? 'progress-fill-danger'
                          : (summary.expense_total / goalAmount >= 0.8
                            ? 'progress-fill-warning'
                            : 'progress-fill-safe')
                        }`}
                      style={{ width: `${Math.min(100, (summary.expense_total / goalAmount) * 100)}%` }}
                    />
                  </div>
                  <div className="progress-stats">
                    <div>누적 지출: {Number(summary.expense_total).toLocaleString()}원</div>
                    <div>목표: {Number(goalAmount).toLocaleString()}원</div>
                    <div>달성률: {((summary.expense_total / goalAmount) * 100).toFixed(1)}%</div>
                  </div>
                </div>
                <div className="ai-insight-content">
                  {goalFeedback ? (
                    <p>{goalFeedback}</p>
                  ) : (
                    <p>목표 분석 데이터를 불러오는 중입니다...</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 카테고리별 지출 통계 차트 */}
          <div className="chart-section">
            <h3>📊 카테고리별 지출 통계</h3>
            {categoryStats.length > 0 ? (
              <div className="category-chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={renderCustomizedLabel}
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="category-details">
                  <h4>카테고리별 지출 금액</h4>
                  <ul className="category-list">
                    {categoryStats.map((category, index) => (
                      <li key={index} className="category-item">
                        <span className="category-color" style={{ backgroundColor: category.color }}></span>
                        <span className="category-name">{category.name}</span>
                        <span className="category-amount">{formatCurrency(category.value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="no-data-message">이번 달 지출 데이터가 없습니다.</p>
            )}

            {/* 카테고리별 소비 습관 피드백 */}
            <div className="ai-insight-section">
              <h3>🤖 카테고리별 소비 습관 분석</h3>
              <div className="ai-insight-card">
                <div className="ai-insight-content">
                  {spendingFeedback ? (
                    <p>{spendingFeedback}</p>
                  ) : (
                    <p>분석 데이터를 불러오는 중입니다...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 월별 지출 비교 */}
          <div className="chart-section">
            <h3>📈 이번 달 vs 저번 달 누적 지출 비교</h3>
            <div className="comparison-stats">
              <div className="comparison-total">오늘까지 {todaySpending.toLocaleString()}원 썼어요</div>
              <div className="comparison-diff">
                지난달보다{" "}
                <span className={diff > 0 ? 'diff-more' : 'diff-less'}>
                  {Math.abs(diff).toLocaleString()}원 {diff > 0 ? '더' : '덜'} 쓰는 중
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={comparisonData.current}
              margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                <XAxis
                  dataKey="day"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tick={{ fill: '#ccc' }}
                />
                <YAxis tickFormatter={(v) => `${v.toLocaleString()}원`} tick={{ fill: '#ccc' }} />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()}원`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  data={comparisonData.previous}
                  name="저번 달"
                  stroke="#888888"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  data={comparisonData.current}
                  name="이번 달"
                  stroke="#1890ff"
                  strokeWidth={3}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 월별 수입/지출 비교 및 GPT 분석 */}
          <div className="ai-insight-section">
            <h3>📊 월간 재정 분석</h3>
            <div className="ai-insight-card">
              {monthlyTotals.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyTotals}
                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `${v.toLocaleString()}`} />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()}원`} />
                    <Legend />
                    <Bar dataKey="income" fill={COLORS[0]} name="수입" />
                    <Bar dataKey="expense" fill={COLORS[3]} name="지출" />
                  </BarChart>
                </ResponsiveContainer>
                ) : (
                <div className="no-data-message" style={{ padding: '40px 0', textAlign: 'center' }}>
                  <p>월별 거래 데이터가 없습니다.</p>
                  <p>거래를 입력하면 월별 수입/지출 차트가 생성됩니다.</p>
                </div>
              )}

              <div className="ai-insight-summary">
                <h4>요약</h4>
                  <pre>{monthlyFeedback.summary || '월별 데이터를 불러오는 중...'}</pre>
              </div>

              <div className="ai-insight-content">
                <h4>분석</h4>
                  <p>{monthlyFeedback.feedback || '분석 데이터를 불러오는 중...'}</p>
              </div>
            </div>
          </div>

          {/* 지출 예측 그래프 */}
          <div className="chart-section">
  <h3>
    📊 지출 예측 그래프 
    {predictionMethod === 'machine_learning' && <span className="prediction-badge ml">머신러닝</span>}
    {predictionMethod === 'gpt' && <span className="prediction-badge gpt">GPT</span>}
  </h3>
  
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={spendingPrediction}
    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis tickFormatter={formatCurrency} />
      <Tooltip formatter={(value) => formatCurrency(value)} />
      <Legend />
      <Bar dataKey="amount" name="지출 금액" fill="#8884d8">
        {spendingPrediction.map((entry, index) => (
          <Cell 
            key={`cell-${index}`} 
            fill={entry.fill || (index === spendingPrediction.length - 1 ? '#ff7300' : '#8884d8')}
          />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
  
  <div className="prediction-info">
    {predictionMethod === 'machine_learning' && (
      <p className="prediction-note">
        머신러닝 모델이 지난 데이터를 분석하여 다음 달 지출을 예측했습니다.
      </p>
    )}
    {predictionMethod === 'gpt' && (
      <p className="prediction-note">
        GPT 모델이 지난 데이터를 분석하여 다음 달 지출을 예측했습니다.
      </p>
    )}
  </div>
</div>
          
          {/* 고정 지출 내역 */}
          <div className="fixed-expenses">
            <h3>📌 고정 지출 내역</h3>

            {fixedExpenses.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>카테고리</th>
                    <th>메모</th>
                    <th>평균 금액</th>
                    <th>총액</th>
                    <th>지출 횟수</th>
                    <th>지출일</th>
                  </tr>
                </thead>
                <tbody>
                  {fixedExpenses.map((item, idx) => {
                    const uniqueDays = item.days
                      ? [...new Set(item.days.split(','))] // 중복 제거
                      : [];

                    const repeatedDayStr = uniqueDays.length === 1
                      ? `매달 ${uniqueDays[0]}일`
                      : uniqueDays.map(d => `${d}일`).join(', ');

                    return (
                      <tr key={idx}>
                        <td>{item.category}</td>
                        <td>{item.memo}</td>
                        <td>
                          {Number(item.avg_amount).toLocaleString()}원
                        </td>
                        <td>
                          {Number(item.total_amount).toLocaleString()}원
                        </td>
                        <td>
                          {item.count}회
                        </td>
                        <td>
                          {item.days ? repeatedDayStr : '날짜 정보 없음'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p>고정 지출 항목이 없습니다.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarPage;