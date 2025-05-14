const db = require('../models/db');

const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 환경변수에서 API 키 가져오기
});

// 카테고리 별 피드백
exports.getSpendingFeedback = async (req, res) => {
  const { summary } = req.body;
  if (!summary) return res.status(400).json({ message: 'summary가 필요합니다.' });

  const prompt = `
다음은 사용자의 한 달 소비 내역 요약입니다:

${summary}

- 메모 내용에는 다양한 단어가 포함되어 있을 수 있으나, 의미상 유사한 단어(예: 야식, 치킨, 피자 등)를 '배달음식'처럼 일반화해서 판단해주세요.
- 만약 메모가 거의 없거나 유의미하지 않다면, 카테고리 정보만 바탕으로 피드백을 작성해주세요.

위 정보를 기반으로 사용자에게 소비 습관에 대한 피드백을 한국어로 1~2문장으로 작성해주세요.
말투는 너무 딱딱하지 않고, 부드럽고 친절한 조언 형태로 작성해주세요.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '너는 친절한 소비 습관 분석 도우미야.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    const feedback = response.choices[0].message.content;
    res.json({ feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'GPT 피드백 생성 실패' });
  }
};


// 월별 수입/지출 비교 요약 + GPT 분석(요약은 TRANSACTION에서 안하고 한번에 처리)
exports.getMonthlyFeedback = async (req, res) => {
  const { user_id, month } = req.query;
  if (!user_id || !month) return res.status(400).json({ message: 'user_id와 month는 필수입니다.' });

  const prevMonth = new Date(`${month}-01`);
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevMonthStr = prevMonth.toISOString().slice(0, 7);

  const sql = `
    SELECT 
      DATE_FORMAT(transaction_date, '%Y-%m') AS month,
      type,
      SUM(amount) AS total
    FROM transactions
    WHERE user_id = ? AND DATE_FORMAT(transaction_date, '%Y-%m') IN (?, ?)
    GROUP BY month, type
  `;

  db.query(sql, [user_id, month, prevMonthStr], async (err, rows) => {
    if (err) return res.status(500).json({ error: err });

    const result = {
      current: { income: 0, expense: 0 },
      previous: { income: 0, expense: 0 },
    };

    rows.forEach(row => {
      const target = row.month === month ? 'current' : 'previous';
      result[target][row.type] = Math.round(row.total);
    });

    // 금액 형식을 소수점 없이 천 단위 구분자만 있게 변경
    const formatAmount = (amount) => amount.toLocaleString() + '원';

    const summary = `
      [이번 달]
      - 수입: ${formatAmount(result.current.income)}
      - 지출: ${formatAmount(result.current.expense)}

      [지난 달]
      - 수입: ${formatAmount(result.previous.income)}
      - 지출: ${formatAmount(result.previous.expense)}
      `.trim();

    const prompt = `
      다음은 사용자의 월별 수입/지출 비교 요약입니다:

      ${summary}

      - 두 달 간의 수입/지출의 변화와 차이를 분석해주세요.
      - 과소비 항목이나 개선점이 있으면 부드럽게 조언해주세요.
      - 1~2문장으로 요약하고, 이모지 1~2개 포함해주세요.
      `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '너는 친절한 월별 소비 분석 도우미야.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      });

      const feedback = response.choices[0].message.content;
      res.json({ summary, feedback });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'GPT 피드백 생성 실패' });
    }
  });
};

// GPT 기반 지출 예측
exports.predictSpending = async (req, res) => {
  console.log('요청 본문:', req.body);
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ message: 'user_id는 필수입니다.' });

  const sql = `
    SELECT 
      DATE_FORMAT(transaction_date, '%Y-%m') AS month,
      ROUND(SUM(amount)) AS total
    FROM transactions
    WHERE 
      user_id = ?
      AND type = 'expense'
      AND transaction_date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-01')
    GROUP BY month
    ORDER BY month ASC;
  `;

  db.query(sql, [user_id], async (err, rows) => {
    if (err) return res.status(500).json({ error: err });

    const lines = rows.map(r => `- ${r.month.split('-')[1]}월: ${r.total}원`).join('\n');

    const prompt = `
      다음은 사용자의 최근 5개월 지출 내역입니다.
      이 데이터를 바탕으로 다음 달 예상 지출 금액을 알려주세요.
      숫자만 (쉼표 없이, 원 단위) 반환해주세요.

      지출 내역:
      ${lines}

      예상:
      - 다음 달:
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "너는 월별 지출 데이터를 기반으로 다음달 예상 지출을 숫자로 예측하는 가계부 분석가야. 숫자만 출력해." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
      });

      const text = completion.choices[0].message.content;
      const prediction = parseInt(text.replace(/[^0-9]/g, '')) || 0;

      res.status(200).json({
        history: rows,
        prediction
      });
    } catch (gptError) {
      console.error("GPT 예측 실패:", gptError.message);
      res.status(500).json({ error: 'GPT 호출 실패', detail: gptError.message });
    }
  });
};

//목표지출 금액 설정후 gpt가 메시지 던짐
exports.generateGoalFeedback = async (req, res) => {
  const { user_id, month } = req.body;
  if (!user_id || !month) {
    return res.status(400).json({ message: 'user_id와 month는 필수입니다.' });
  }

  try {
    // 1. 목표 금액 가져오기
    const [goalRows] = await db.promise().query(
      'SELECT amount FROM goals WHERE user_id = ? AND month = ?',
      [user_id, month]
    );

    if (goalRows.length === 0) {
      return res.status(404).json({ message: '목표 금액이 설정되지 않았습니다.' });
    }

    const goal = goalRows[0].amount;

    // 2. 누적 지출 합계 가져오기
    const [sumRows] = await db.promise().query(`
      SELECT SUM(amount) AS total 
      FROM transactions 
      WHERE user_id = ? AND type = 'expense' AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`,
      [user_id, month]
    );

    const total = sumRows[0].total || 0;

    // 3. 목표 대비 진행률 판단
    const ratio = total / goal;
    let situation = '여유';

    if (ratio >= 1) {
      situation = '초과';
    } else if (ratio >= 0.8) {
      situation = '근접';
    }

    // 4. GPT 프롬프트 생성
    let prompt = '';

    if (situation === '초과') {
      prompt = `
        사용자의 이번 달 지출 목표는 ${goal.toLocaleString()}원이며, 
        현재 누적 지출은 ${total.toLocaleString()}원입니다.

        이미 목표를 초과한 상태입니다. 다음 조건을 지켜 피드백을 작성해주세요:
        - 과소비를 지적하거나, 반성보다는 다음 달을 준비하도록 유도
        - 문장은 1~2개, 부드럽지만 현실적인 톤
        - 한국어로 작성
        `;
    } else if (situation === '근접') {
      prompt = `
        사용자의 이번 달 지출 목표는 ${goal.toLocaleString()}원이며, 
        현재 누적 지출은 ${total.toLocaleString()}원으로 목표 금액에 매우 근접한 상태입니다.

        ※ 이 목표는 반드시 초과하지 말아야 하는 상한선입니다.
        현재 지출은 목표에 매우 근접해 있으며, 이 상태가 지속된다면 초과할 위험이 큽니다.

        다음 조건을 반드시 지켜 경고 메시지를 생성해주세요:
        - 이제부터는 지출을 매우 조심해야 하며, 목표를 초과하지 않도록 강한 주의가 필요합니다.
        - 목표 달성, 도달, 완료와 같은 단어는 절대 사용하지 마세요.
        - '목표 도달', '달성', '응원' 같은 긍정적 표현은 피해주세요
        - 목표를 넘지 않도록 주의하라는 실질적인 조언을 1~2문장, 부드럽지만 단호한 어조로 작성해주세요.
        - 문장은 한국어로 자연스럽게 써 주세요.
        `;
    } else {
      prompt = `
        사용자의 이번 달 지출 목표는 ${goal.toLocaleString()}원이며, 
        현재 누적 지출은 ${total.toLocaleString()}원입니다.

        목표 대비 아직 여유가 있습니다. 다음 조건을 따라 칭찬 메시지를 작성해주세요:
        - 1~2문장, 자연스럽고 따뜻한 톤
        - 문장은 한국어로 작성
        `;
    }

    // 5. GPT 호출
    const gptRes = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    });

    const message = gptRes.choices[0].message.content.trim();

    res.status(200).json({ goal, total, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'GPT 피드백 생성 실패', detail: err.message });
  }
};
