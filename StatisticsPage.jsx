import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer
} from 'recharts';

const StatisticsPage = () => {
  const [month, setMonth] = useState('2025-05');
  const [data, setData] = useState([]);
  const userId = 1;

  const fetchStatistics = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/transactions/statistics?user_id=${userId}&month=${month}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('통계 불러오기 실패', err);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [month]);

  return (
    <div style={{ padding: 20 }}>
      <h2>📊 월별 수입/지출 통계</h2>

      <div style={{ marginBottom: 10 }}>
        <label>📅 월 선택: </label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(date) => date.slice(5)} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="income" fill="#00C49F" name="수입" />
          <Bar dataKey="expense" fill="#FF8042" name="지출" />
        </BarChart>
      </ResponsiveContainer>

      {/* 🤖 AI 피드백 컴포넌트 */}
      <MonthlyAiFeedback user_id={userId} month={month} />
    </div>
  );
};

const MonthlyAiFeedback = () => {
  const [month, setMonth] = useState('2025-05');
  const [summary, setSummary] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const user_id = 1;

  const handleGenerate = async () => {
    setLoading(true);
    setFeedback('');
    setSummary('');

    try {
      const res = await fetch(`http://localhost:5000/api/transactions/ai/monthly-feedback?user_id=${user_id}&month=${month}`);
      const data = await res.json();
      setSummary(data.summary);
      setFeedback(data.feedback);
    } catch (err) {
      alert('AI 피드백 요청 실패');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h3>🤖 월별 소비 피드백 (GPT)</h3>
      <label>월 선택:</label>
      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        style={{ marginLeft: 10 }}
      />
      <button onClick={handleGenerate} style={{ marginLeft: 10 }}>피드백 요청</button>

      {loading && <p>GPT 분석 중입니다...</p>}

      {summary && (
        <div style={{ marginTop: 20 }}>
          <h4>📄 요약</h4>
          <pre>{summary}</pre>
        </div>
      )}

      {feedback && (
        <div style={{ marginTop: 20, background: '#f5f5f5', padding: 15, borderRadius: 8 }}>
          <h4>GPT 피드백</h4>
          <p>{feedback}</p>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;
