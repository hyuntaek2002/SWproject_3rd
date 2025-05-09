import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()

  const goTo = (path) => {
    navigate(path)
  }

  const handleSurveyCheck = (targetPath) => {
    const hasCompletedSurvey = localStorage.getItem('surveyCompleted') === 'true'
    if (!hasCompletedSurvey) {
      alert('설문조사를 먼저 해주세요')
      return
    }
    goTo(targetPath)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('surveyCompleted')
    navigate('/login')
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>메인 화면</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '200px' }}>
        <button onClick={() => handleSurveyCheck('/stocks')}>추천 주식 보기</button>
        <button onClick={() => handleSurveyCheck('/coin')}>추천 코인 보기</button>
        <button onClick={() => goTo('/survey')}>설문조사 하기</button>
        <button onClick={() => goTo('/wallet')}>지갑 관리</button>
        <button onClick={() => goTo('/calendar')}>캘린더 관리</button>
        <button onClick={() => goTo('/assets')}>모든 자산 보기</button>
        <button onClick={handleLogout}>로그아웃</button>
      </div>
    </div>
  )
}

export default Dashboard
