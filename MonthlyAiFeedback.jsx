import React, { useState } from 'react';

const MonthlyAiFeedback = () => {
  const [month, setMonth] = useState('2025-05');
  const [summary, setSummary] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const user_id = 1;

  const handleGenerate = async () => {
    setLoading(true);
    setFeedback('');

    try {
      // 1단계: 월 요약 가져오기
      const res1 = await fetch(`http://localhost:5000/api/transactions/monthly-summary?user_id=${user_id}&month=${month}`);
      const data1 = await res1.json();
      setSummary(data1.summary);

      // 2단계: GPT에 요청
      const res2 = await fetch(`http://localhost:5000/api/ai/spending-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: data1.summary })
      });

      const data2 = await res2.json();
      setFeedback(data2.feedback);
    } catch (err) {
      alert('피드백 생성 실패');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📊 월별 수입/지출 AI 피드백</h2>
      <label>분석할 월:</label>
      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        style={{ marginLeft: 10 }}
      />
      <button onClick={handleGenerate} style={{ marginLeft: 10 }}>피드백 요청</button>

      {loading && <p>GPT가 분석 중입니다...</p>}

      {summary && (
        <div style={{ marginTop: 20 }}>
          <h4>📄 요약 내용</h4>
          <pre>{summary}</pre>
        </div>
      )}

      {feedback && (
        <div style={{ marginTop: 20, background: '#f5f5f5', padding: 15, borderRadius: 8 }}>
          <h4>🤖 GPT 피드백</h4>
          <p>{feedback}</p>
        </div>
      )}
    </div>
  );
};

export default MonthlyAiFeedback;
