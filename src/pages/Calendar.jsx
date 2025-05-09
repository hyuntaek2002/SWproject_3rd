import React, { useEffect, useState } from 'react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import {
  getMonthlyStatistics,
  getMonthlySummary,
  searchTransactions,
} from '../api/transactionApi';
import { saveGoal, getGoal } from '../api/goalApi';
import {
  spendingFeedback,
  monthlyFeedback,
  predictSpending,
  goalFeedback,
} from '../api/aiApi';

function Calendar() {
  // 캘린더 상태
  const [date, setDate] = useState(new Date());

  // 거래 통계/요약
  const [stats, setStats] = useState([]);
  const [summary, setSummary] = useState(null);

  // 목표 관리
  const [goalAmt, setGoalAmt] = useState('');
  const [retrievedGoal, setRetrievedGoal] = useState(null);

  // AI 피드백
  const [feedback, setFeedback] = useState('');
  const [monthlyFb, setMonthlyFb] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [goalFb, setGoalFb] = useState('');

  const userId = 1; // 예시 사용자 ID
  const monthStr = `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;

  // date(달) 변경 시 통계/요약 호출
  useEffect(() => {
    const params = { user_id: userId, month: monthStr };

    getMonthlyStatistics(params)
      .then(res => setStats(res.data))
      .catch(err => console.error(err));

    getMonthlySummary(params)
      .then(res => setSummary(res.data))
      .catch(err => console.error(err));
  }, [date]);

  // 핸들러 함수들
  const handleSearch = () => {
    searchTransactions({ user_id: userId, memo: '점심' })
      .then(res => alert(JSON.stringify(res.data, null, 2)))
      .catch(err => console.error(err));
  };

  const handleSaveGoal = () => {
    saveGoal({ user_id: userId, month: monthStr, amount: Number(goalAmt) })
      .then(res => alert(res.data.message))
      .catch(err => console.error(err));
  };

  const handleGetGoal = () => {
    getGoal({ user_id: userId, month: monthStr })
      .then(res => setRetrievedGoal(res.data.amount))
      .catch(err => console.error(err));
  };

  const handleSpendingFb = () => {
    spendingFeedback({ summary: JSON.stringify(summary) })
      .then(res => setFeedback(res.data.feedback))
      .catch(err => console.error(err));
  };

  const handleMonthlyFb = () => {
    monthlyFeedback({ user_id: userId, month: monthStr })
      .then(res => setMonthlyFb(res.data.feedback))
      .catch(err => console.error(err));
  };

  const handlePredict = () => {
    predictSpending({ user_id: userId })
      .then(res => setPrediction(res.data.prediction))
      .catch(err => console.error(err));
  };

  const handleGoalFb = () => {
    goalFeedback({ user_id: userId, month: monthStr })
      .then(res => setGoalFb(res.data.message))
      .catch(err => console.error(err));
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>캘린더 관리 & 데모</h2>

      {/* 달력 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <ReactCalendar onChange={setDate} value={date} />
        <p>선택된 달: {monthStr}</p>
      </div>

      {/* 거래 통계/요약 */}
      <section style={{ marginBottom: '1.5rem' }}>
        <h3>거래 통계</h3>
        <pre>{JSON.stringify(stats, null, 2)}</pre>
        <h3>거래 요약</h3>
        <pre>{JSON.stringify(summary, null, 2)}</pre>
        <button onClick={handleSearch}>메모에 "점심" 포함 거래 검색</button>
      </section>

      {/* 목표 관리 */}
      <section style={{ marginBottom: '1.5rem' }}>
        <h3>목표 관리</h3>
        <input
          type="number"
          placeholder="저장할 목표 금액"
          value={goalAmt}
          onChange={e => setGoalAmt(e.target.value)}
          style={{ marginRight: '0.5rem' }}
        />
        <button onClick={handleSaveGoal}>목표 저장</button>
        <button onClick={handleGetGoal}>목표 조회</button>
        {retrievedGoal !== null && <p>조회된 목표: {retrievedGoal}원</p>}
      </section>

      {/* AI 피드백 */}
      <section>
        <h3>AI 피드백</h3>
        <button onClick={handleSpendingFb}>소비 습관 피드백</button>
        {feedback && <p>{feedback}</p>}
        <br />
        <button onClick={handleMonthlyFb}>월별 비교 피드백</button>
        {monthlyFb && <p>{monthlyFb}</p>}
        <br />
        <button onClick={handlePredict}>다음달 지출 예측</button>
        {prediction !== null && <p>예측 지출: {prediction}원</p>}
        <br />
        <button onClick={handleGoalFb}>목표 대비 피드백</button>
        {goalFb && <p>{goalFb}</p>}
      </section>
    </div>
  );
}

export default Calendar;
