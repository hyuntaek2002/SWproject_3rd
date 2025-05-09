import React, { useEffect, useState } from 'react';
import CategoryAiFeedback from './CategoryAiFeedback';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c', '#d0ed57', '#d84f4f'];

const CategoryStatistics = () => {
  const [data, setData] = useState([]);
  const user_id = 1; // 실제 로그인 사용자 ID로 교체 예정
  const [month, setMonth] = useState('2025-05');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/transactions/category-statistics?user_id=${user_id}&month=${month}`);
        const json = await res.json();
        const processed = json.map(d => ({ name: d.category, value: parseFloat(d.total) }));
        setData(processed);
      } catch (error) {
        console.error('카테고리 통계 불러오기 실패:', error);
      }
    };
    fetchData();
  }, [month]);

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ marginBottom: 10 }}>
      <label>
        📅 월 선택:{' '}
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </label>
    </div>
      <h3>📂 카테고리별 지출 통계</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      {/* AI 피드백 컴포넌트 추가 */}
      <CategoryAiFeedback selectedMonth={month} />
    </div>
  );
};

export default CategoryStatistics;
