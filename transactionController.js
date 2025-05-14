const db = require('../models/db');

exports.createTransaction = (req, res) => {
  const { user_id, type, category, amount, memo, transaction_date } = req.body;
  const query = `INSERT INTO transactions (user_id, type, category, amount, memo, transaction_date)
                VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(query, [user_id, type, category, amount, memo, transaction_date], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ message: '거래 등록 완료', transactionId: result.insertId });
  });
};

exports.getTransactions = (req, res) => {
  const { user_id, month } = req.query;
  let query = `SELECT * FROM transactions WHERE user_id = ?`;
  const params = [user_id];

  if (month) {
    query += ` AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`;
    params.push(month);
  }

  db.query(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.status(200).json(rows);
  });
};

// 📊 월별 수입/지출 통계
exports.getMonthlyStatistics = (req, res) => {
  const { user_id, month } = req.query;

  if (!user_id || !month) {
    return res.status(400).json({ error: 'user_id와 month는 필수입니다.' });
  }

  const query = `
    SELECT 
      transaction_date AS date,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
    FROM transactions
    WHERE user_id = ? AND DATE_FORMAT(transaction_date, '%Y-%m') = ?
    GROUP BY transaction_date
    ORDER BY transaction_date
  `;

  db.query(query, [user_id, month], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.status(200).json(rows);
  });
};

//수정
exports.updateTransaction = (req, res) => {
  const { id } = req.params;
  const { type, category, amount, memo, transaction_date } = req.body;

  const sql = `
    UPDATE transactions
    SET type = ?, category = ?, amount = ?, memo = ?, transaction_date = ?
    WHERE id = ?
  `;

  db.query(sql, [type, category, amount, memo, transaction_date, id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: '수정 완료' });
  });
};

//삭제
exports.deleteTransaction = (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM transactions WHERE id = ?`;

  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: '삭제 완료' });
  });
};

//월 총합 수입&지출 표시
exports.getMonthlySummary = (req, res) => {
  const { user_id, month } = req.query;

  const query = `
    SELECT 
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income_total,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense_total
    FROM transactions
    WHERE user_id = ? AND DATE_FORMAT(transaction_date, '%Y-%m') = ?
  `;

  db.query(query, [user_id, month], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(200).json(result[0]);
  });
};

//메모 검색 기능
exports.searchTransactions = (req, res) => {
  const { user_id, memo } = req.query;
  if (!user_id || !memo) {
    return res.status(400).json({ message: 'user_id와 memo는 필수입니다.' });
  }

  const query = `
    SELECT * FROM transactions
    WHERE user_id = ? AND memo LIKE ?
    ORDER BY transaction_date DESC
  `;

  db.query(query, [user_id, `%${memo}%`], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

// 카테고리별 월 지출 통계
exports.getCategoryStatistics = (req, res) => {
  const { user_id, month } = req.query;

  if (!user_id || !month) {
    return res.status(400).json({ message: 'user_id와 month는 필수입니다.' });
  }

  const sql = `
    SELECT category, SUM(amount) AS total
    FROM transactions
    WHERE user_id = ? AND type = 'expense' AND DATE_FORMAT(transaction_date, '%Y-%m') = ?
    GROUP BY category
    ORDER BY total DESC
  `;

  db.query(sql, [user_id, month], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

// 카테고리별 요약 생성 (GPT용)
exports.getCategorySummary = (req, res) => {
  const { user_id, month } = req.query;

  if (!user_id || !month) {
    return res.status(400).json({ message: 'user_id와 month는 필수입니다.' });
  }

  const sql = `
    SELECT category, SUM(amount) AS total, GROUP_CONCAT(memo SEPARATOR ', ') AS memos
    FROM transactions
    WHERE user_id = ? AND type = 'expense' AND DATE_FORMAT(transaction_date, '%Y-%m') = ?
    GROUP BY category
  `;

  db.query(sql, [user_id, month], (err, rows) => {
    if (err) return res.status(500).json({ error: err });

    const summary = rows.map(row => 
      `카테고리 '${row.category}'에 총 ${row.total.toLocaleString()}원 지출. 메모 내용: ${row.memos || '없음'}`
    ).join('\n');

    res.json({ summary });
  });
};

// 월별 수입/지출 합계를 GPT 요약용으로 반환
exports.getMonthlySummaryForGPT = (req, res) => {
  const { user_id, currentMonth } = req.query;
  if (!user_id || !currentMonth) {
    return res.status(400).json({ message: 'user_id와 currentMonth는 필수입니다.' });
  }

  // 지난달 계산
  const [year, month] = currentMonth.split('-');
  const prevDate = new Date(year, parseInt(month) - 2); // JS는 0-indexed
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const sql = `
    SELECT 
      DATE_FORMAT(transaction_date, '%Y-%m') as month,
      type,
      SUM(amount) as total
    FROM transactions
    WHERE user_id = ? AND (DATE_FORMAT(transaction_date, '%Y-%m') = ? OR DATE_FORMAT(transaction_date, '%Y-%m') = ?)
    GROUP BY month, type
  `;

  db.query(sql, [user_id, currentMonth, prevMonth], (err, rows) => {
    if (err) return res.status(500).json({ error: err });

    const summary = { [currentMonth]: { income: 0, expense: 0 }, [prevMonth]: { income: 0, expense: 0 } };
    rows.forEach(r => {
      summary[r.month][r.type] = r.total;
    });

    const summaryText = `
- 이번 달(${currentMonth}) 수입: ${summary[currentMonth].income || 0}원 / 지출: ${summary[currentMonth].expense || 0}원
- 지난 달(${prevMonth}) 수입: ${summary[prevMonth].income || 0}원 / 지출: ${summary[prevMonth].expense || 0}원
`;

    res.json({ summary: summaryText });
  });
};

// 고정 지출 자동 인식
exports.getFixedExpenses = (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: 'user_id는 필수입니다.' });
  }

  const sql = `
  SELECT 
    category,
    memo,
    ROUND(AVG(amount)) AS avg_amount,
    COUNT(*) AS count,
    ROUND(SUM(amount)) AS total_amount,
    GROUP_CONCAT(DAY(transaction_date)) AS days
  FROM transactions
  WHERE 
    user_id = ?
    AND type = 'expense'
    AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 4 MONTH)
  GROUP BY category, memo
  HAVING 
    count >= 3
    AND MAX(amount) - MIN(amount) <= 3000
    AND STDDEV_POP(DAY(transaction_date)) <= 3
`;

  db.query(sql, [user_id], (err, rows) => {
    if (err) {
      console.error('고정지출 분석 오류:', err);
      return res.status(500).json({ error: err });
    }
    res.status(200).json(rows);
  });
};

//수동 고정지출
exports.getManuallyFixedExpenses = (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ message: 'user_id는 필수입니다.' });

  const sql = `
    SELECT 
      category,
      memo,
      ROUND(AVG(amount)) AS avg_amount,
      COUNT(*) AS count,
      ROUND(SUM(amount)) AS total_amount,
      GROUP_CONCAT(DAY(transaction_date)) AS days
    FROM transactions
    WHERE user_id = ? AND is_fixed = TRUE
    GROUP BY category, memo
  `;

  db.query(sql, [user_id], (err, rows) => {
    if (err) {
      console.error('수동 고정지출 조회 오류:', err);
      return res.status(500).json({ error: err });
    }
    res.status(200).json(rows);
  });
};

// 특정 거래의 고정지출 여부 수정
exports.updateFixedStatus = (req, res) => {
  const { id } = req.params;
  const { is_fixed } = req.body;

  if (typeof is_fixed !== 'boolean') {
    return res.status(400).json({ message: 'is_fixed는 boolean이어야 합니다.' });
  }

  const sql = `UPDATE transactions SET is_fixed = ? WHERE id = ?`;

  db.query(sql, [is_fixed, id], (err, result) => {
    if (err) {
      console.error('고정지출 상태 변경 오류:', err);
      return res.status(500).json({ error: err });
    }
    res.status(200).json({ message: '고정지출 상태가 변경되었습니다.' });
  });
};

// 월별 누적 지출 비교
exports.getMonthlyComparison = (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ message: 'user_id는 필수입니다.' });

  const sql = `
    SELECT 
      DAY(transaction_date) AS day,
      MONTH(transaction_date) AS month,
      SUM(amount) AS total
    FROM transactions
    WHERE 
      user_id = ?
      AND type = 'expense'
      AND transaction_date >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
    GROUP BY MONTH(transaction_date), DAY(transaction_date)
    ORDER BY month, day;
  `;

  db.query(sql, [user_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;

    const currentData = rows.filter(r => r.month === currentMonth).map(r => ({
      day: r.day,
      total: r.total
    }));

    const previousData = rows.filter(r => r.month === previousMonth).map(r => ({
      day: r.day,
      total: r.total
    }));

    res.status(200).json({
      current_month: currentMonth,
      previous_month: previousMonth,
      current_data: currentData,
      previous_data: previousData
    });
  });
};
