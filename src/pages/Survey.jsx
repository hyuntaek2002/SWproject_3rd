import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axiosInstance'

const questions = [
  {
    question: '1. 수익과 손실 중 무엇이 더 중요하신가요?',
    options: [
      '원금 손실은 절대 용납할 수 없습니다.',
      '원금은 웬만하면 지키고 싶습니다.',
      '약간의 손실은 괜찮습니다.',
      '손실이 있어도 수익 가능성이 있다면 감수하겠습니다.',
      '높은 수익을 위해 큰 손실도 감수할 수 있습니다.'
    ]
  },
  {
    question: '2. 투자 기간은 얼마나 계획하고 계신가요?',
    options: ['6개월 이하', '1년 이내', '1~3년', '3~5년', '5년 이상']
  },
  {
    question: '3. 다음 중 본인의 투자 경험 수준은?',
    options: [
      '거의 없음',
      '예금, 적금 정도',
      '국내 주식 정도',
      '해외주식이나 펀드 경험 있음',
      '암호화폐, 파생상품 등 고위험 자산 경험 있음'
    ]
  },
  {
    question: '4. 투자 중 손실이 20% 발생하면 어떻게 하시겠습니까?',
    options: [
      '바로 전액 매도하겠습니다',
      '일부 매도하고 현금 확보',
      '일정 기간 지켜봅니다',
      '오히려 추가 매수 고려',
      '평정심 유지하며 장기 보유'
    ]
  },
  {
    question: '5. 당신의 현재 주요 수입원은?',
    options: [
      '고정급여 외 수입 없음',
      '고정급 + 약간의 사이드 수입',
      '프리랜서 등 유동적인 수입',
      '사업/투자 수입 비중 큼',
      '고위험/고수익 투자에도 익숙함'
    ]
  }
]

function Survey() {
  const [answers, setAnswers] = useState(Array(5).fill(0))
  const [goal, setGoal] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleSelect = (index, value) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const getRiskType = (total) => {
    if (total >= 20) return '공격형'
    if (total >= 13) return '중립형'
    return '안정형'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const total = answers.reduce((a, b) => a + b, 0)
    const risk = getRiskType(total)
    const token = localStorage.getItem('token')

    try {
      await axios.post(
        '/survey',
        { risk_tolerance: risk, investment_goal: goal },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      localStorage.setItem('surveyCompleted', 'true')
      setMessage(`설문 저장 완료! 당신의 성향은 [${risk}]입니다.페이지가 자동으로 넘어갑니다.잠시만 기다려주세요`)

      setTimeout(() => {
        navigate('/dashboard') // 자동 이동
      }, 1500)
    } catch (err) {
      setMessage('설문 저장 실패')
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>설문조사</h2>
      <form onSubmit={handleSubmit}>
        {questions.map((q, idx) => (
          <div key={idx} style={{ marginBottom: '1rem' }}>
            <p>{q.question}</p>
            {q.options.map((option, i) => (
              <label key={i} style={{ marginRight: '1rem' }}>
                <input
                  type="radio"
                  name={`q${idx}`}
                  value={i + 1}
                  checked={answers[idx] === i + 1}
                  onChange={() => handleSelect(idx, i + 1)}
                  required
                />
                {option}
              </label>
            ))}
          </div>
        ))}

        <label>투자 목표:</label><br />
        <input
          type="text"
          placeholder="예: 단기 수익, 은퇴 대비 등"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          required
        /><br /><br />

        <button type="submit">제출</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}

export default Survey
