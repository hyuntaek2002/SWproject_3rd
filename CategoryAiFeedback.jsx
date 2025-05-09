import React, { useState } from 'react';

const CategoryAiFeedback = () => {
  const [month, setMonth] = useState('2025-05');
  const [summary, setSummary] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const user_id = 1; // 실제 로그인 유저로 교체 필요

  const handleGenerate = async () => {
    setLoading(true);
    setFeedback('');
    try {
      // 1. 요약 가져오기
      const res1 = await fetch(`http://localhost:5000/api/transactions/category-summary?user_id=${user_id}&month=${month}`);
      const data1 = await res1.json();
      setSummary(data1.summary);

      // 2. GPT 요청
      const res2 = await fetch('http://localhost:5000/api/ai/spending-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: data1.summary })
      });
      const data2 = await res2.json();
      setFeedback(data2.feedback);
    } catch (err) {
      alert('요청 실패');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📊 카테고리별 소비 습관 AI 피드백</h2>

      <label>분석할 월:</label>
      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        style={{ marginLeft: 10 }}
      />
      <button onClick={handleGenerate} style={{ marginLeft: 10 }}>
        피드백 요청
      </button>

      {loading && <p>AI가 분석 중입니다...</p>}

      {/*있어도 되고 없어도 되고*/}
      {summary && (
        <div style={{ marginTop: 20 }}>
          <h4>요약 내용</h4>
          <pre>{summary}</pre>
        </div>
      )}

      {feedback && (
        <div style={{ marginTop: 30, background: '#f5f5f5', padding: 15, borderRadius: 8 }}>
          <h4>🔍 AI의 피드백</h4>
          <p>{feedback}</p>
        </div>
      )}
    </div>
  );
};

export default CategoryAiFeedback;
