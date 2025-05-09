import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import {
  BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import 'react-calendar/dist/Calendar.css';

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    type: 'expense',
    category: '',
    amount: '',
    memo: '',
    customCategory: '' // 직접입력용 필드 추가
  });
  const [editingId, setEditingId] = useState(null); // 수정 중인 거래 ID
  const [summary, setSummary] = useState({ income_total: 0, expense_total: 0 }); //월별 총합 금액
  const [searchMemo, setSearchMemo] = useState('');//메모 검색 기능
  const [searchResults, setSearchResults] = useState([]);//메모 검색 기능
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [spendingPrediction, setSpendingPrediction] = useState([]);
  const [comparisonData, setComparisonData] = useState({ current: [], previous: [] });
  const [goalAmount, setGoalAmount] = useState(null); // 설정된 목표 금액
const [goalFeedback, setGoalFeedback] = useState(''); // GPT 피드백

  
  
  const categories = ['식비', '교통•자동차', '편의점•마트•잡화', '쇼핑', '의료', '취미•여가', '생활','주거•통신','급여','이체','교육', '직접입력'];

  const user_id = 1;
  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');

  const fetchTransactions = async () => {
    const res = await fetch(`http://localhost:5000/api/transactions?user_id=${user_id}&month=${year}-${month}`);
    const data = await res.json();
    setTransactions(data);
  };

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
    fetchPrediction();
    fetchMonthlyComparison();
    fetchAllFixedExpenses();
    fetchGoalData(); // 목표 금액 및 GPT 피드백 불러오기
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
  
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  
    if (res.ok) {
      alert(editingId ? '수정 완료!' : '등록 완료!');
      setForm({ type: 'expense', category: '', amount: '', memo: '', customCategory: '' });
      setEditingId(null);
      fetchTransactions();
      fetchPrediction();
    } else {
      alert(editingId ? '수정 실패' : '등록 실패');
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제할까요?')) return;
    const res = await fetch(`http://localhost:5000/api/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('삭제 완료!');
      fetchTransactions();
      fetchPrediction();
    } else {
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
  
  const fetchSummary = async () => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const res = await fetch(`http://localhost:5000/api/transactions/summary?user_id=${user_id}&month=${year}-${month}`);
    const data = await res.json();
    setSummary(data);
  };

  const handleSearch = async () => {
    const res = await fetch(`http://localhost:5000/api/transactions/search?user_id=${user_id}&memo=${searchMemo}`);
    const data = await res.json();
    setSearchResults(data);
  };
  const fetchAllFixedExpenses = async () => {
    try {
      const [autoRes, manualRes] = await Promise.all([
        fetch(`http://localhost:5000/api/transactions/fixed?user_id=${user_id}`),
        fetch(`http://localhost:5000/api/transactions/fixed/manual?user_id=${user_id}`)
      ]);

      const autoData = await autoRes.json();
      const manualData = await manualRes.json();

      setFixedExpenses([...autoData, ...manualData]); // 병합
    } catch (err) {
      console.error('고정지출 불러오기 실패:', err);
    }
  };
  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleFixedStatus = async (id, nextStatus) => {
    try {
      await fetch(`http://localhost:5000/api/transactions/${id}/fixed`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_fixed: nextStatus }),
      });
      alert(nextStatus ? '고정지출로 지정되었습니다.' : '고정지출에서 해제되었습니다.');
      fetchTransactions(); // 목록 갱신
    } catch (err) {
      console.error('고정지출 상태 변경 실패:', err);
      alert('실패했습니다.');
    }
  };
  
  const fetchPrediction = async () => {
    const res = await fetch('http://localhost:5000/api/ai/predict-spending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 1 })
    });
  
    const data = await res.json();
    const formatted = data.history.map(item => ({
      name: `${parseInt(item.month.split('-')[1])}월`,
      amount: Number(item.total)
    }));
  
    formatted.push({ name: '다음달', amount: data.prediction });
  
    setSpendingPrediction(formatted);
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

  //이번달, 저번달 비교
  const fetchMonthlyComparison = async () => {
    const res = await fetch(`http://localhost:5000/api/transactions/monthly-comparison?user_id=${user_id}`);
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
      <div style={{ fontSize: '0.7rem', lineHeight: '1.2' }}>
        {income > 0 && <div style={{ color: 'blue' }}>+{income.toLocaleString()}원</div>}
        {expense > 0 && <div style={{ color: 'red' }}>-{expense.toLocaleString()}원</div>}
      </div>
    );
  };
  
  //목표 설정&피드백
  const saveGoalAmount = async () => {
    const res = await fetch('http://localhost:5000/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id,
        month: `${year}-${month}`,
        amount: goalAmount
      })
    });
  
    if (res.ok) {
      alert('목표가 저장되었습니다!');
      fetchGoalData(); // 다시 불러와서 피드백도 갱신
    } else {
      alert('저장 실패');
    }
  };
  
  const fetchGoalData = async () => {
    const res = await fetch(`http://localhost:5000/api/goals?user_id=${user_id}&month=${year}-${month}`);
    const data = await res.json();
    if (res.ok) {
      setGoalAmount(data.amount);
      fetchGoalFeedback(data.amount); // 누적 지출은 summary에서 가져옴
    }
  };
  
  const fetchGoalFeedback = async (goal) => {
    const res = await fetch(`http://localhost:5000/api/ai/goal-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id,
        month: `${year}-${month}`,
        goal
      })
    });
  
    const data = await res.json();
    if (res.ok) {
      setGoalFeedback(data.message);
    } else {
      setGoalFeedback('피드백을 불러오지 못했습니다.');
    }
  };
  

  return (
    <div style={{ padding: 20 }}>
      <h2>📅 수입/지출 캘린더</h2>
      <Calendar
        onClickDay={setSelectedDate}
        value={selectedDate}
        tileContent={tileContent}
      />

      {/*총합 금액*/}
      <div style={{ marginBottom: 10 }}>
          <strong>이번 달 총 수입: </strong> {Number(summary.income_total || 0).toLocaleString()}원 &nbsp;&nbsp;
          <strong>이번 달 총 지출: </strong> {Number(summary.expense_total || 0).toLocaleString()}원
      </div>

      {/*목표 금액 설정&피드백*/}
      <hr />
      <h3>🎯 이번 달 지출 목표</h3>
      <input
        type="number"
        placeholder="예: 500000"
        value={goalAmount || ''}
        onChange={(e) => setGoalAmount(Number(e.target.value))}
      />
      <button onClick={saveGoalAmount}>목표 저장</button>

      {goalAmount && (
        <div style={{ marginTop: 20 }}>
          <div style={{ background: '#eee', height: '20px', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, (summary.expense_total / goalAmount) * 100)}%`,
              backgroundColor: summary.expense_total > goalAmount ? '#ff4d4f' : '#4caf50',
              height: '100%',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p>
            누적 지출: {Number(summary.expense_total).toLocaleString()}원 /
            목표: {Number(goalAmount).toLocaleString()}원
          </p>
          <p><strong>GPT 피드백:</strong> {goalFeedback}</p>
        </div>
      )}
  
      {/*메모 검색*/}
      <div style={{ margin: '20px 0' }}>
        <h3>🔍 메모로 거래 검색</h3>
        <input
          type="text"
          placeholder="예: 커피"
          value={searchMemo}
          onChange={(e) => setSearchMemo(e.target.value)}
        />
        <button onClick={handleSearch}>검색</button>
      </div>

      {/* 검색 결과 출력 */}
      {searchResults.length > 0 && (
        <div>
          <h4>검색 결과:</h4>
          <ul>
            {searchResults.map((t, i) => (
              <li key={i}>
                {t.transaction_date} - {t.category} - {t.amount}원 ({t.memo})
              </li>
            ))}
          </ul>
        </div>
      )}

      <hr />
      <h3>{selectedDate.toLocaleDateString()} 거래 입력</h3>
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

      {/*수정&삭제*/ }
      <input type="number" name="amount" placeholder="금액" value={form.amount} onChange={handleInput} />
      <input type="text" name="memo" placeholder="메모" value={form.memo} onChange={handleInput} />
      <button onClick={handleSubmit}>등록</button>
      <hr />
      <h3>📋 {selectedDate.toLocaleDateString()} 거래 목록</h3>
      <ul>
        {transactions
          .filter(t => t.transaction_date.startsWith(selectedDate.toISOString().slice(0, 10)))
          .map(tx => (
            <li key={tx.id}>
              [{tx.type === 'income' ? '수입' : '지출'}] {tx.category} - {tx.amount.toLocaleString()}원 ({tx.memo})
              <button onClick={() => handleEdit(tx)}>수정</button>
              <button onClick={() => handleDelete(tx.id)}>삭제</button>
              <button onClick={() => toggleFixedStatus(tx.id, !tx.is_fixed)}>
                {tx.is_fixed ? '고정 해제' : '고정 지정'}
              </button>
            </li>
          ))}
      </ul>
      <hr />
      <h3>📌 고정 지출 내역</h3>

      {fixedExpenses.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
          <thead>
            <tr style={{ background: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>카테고리</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>메모</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>평균 금액</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>총액</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>지출 횟수</th>
              <th style={{ border: '1px solid #ccc', padding: '6px' }}>지출일</th>
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
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.category}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.memo}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                    {Number(item.avg_amount).toLocaleString()}원
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                    {Number(item.total_amount).toLocaleString()}원
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                    {item.count}회
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '6px' }}>
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
      <hr></hr>
      <h3>📈 이번 달 vs 저번 달 누적 지출 비교</h3>
      <h2>오늘까지 {todaySpending.toLocaleString()}원 썼어요</h2>
      <p>
        지난달보다{" "}
        <span style={{ color: diff > 0 ? 'red' : 'blue' }}>
          {Math.abs(diff).toLocaleString()}원 {diff > 0 ? '더' : '덜'} 쓰는 중
        </span>
      </p>

      <div style={{ marginTop: 40 }}>
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
            stroke="#007bff"
            strokeWidth={3}
            dot={{ r: 2 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
      <hr></hr>
      <div style={{ marginTop: 40 }}>
        <h3>📊 지출 예측 그래프</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={spendingPrediction}
          margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="amount" fill="#8884d8" name="지출 금액" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CalendarPage;
