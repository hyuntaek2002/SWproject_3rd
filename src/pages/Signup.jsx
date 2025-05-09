// src/pages/Signup.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axiosInstance'

function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setMessage('이메일과 비밀번호를 모두 입력하세요.')
      return
    }
    try {
      const res = await axios.post('/auth/signup', { email, password })
      setMessage(res.data.message)
      setShowConfirm(true)
    } catch (err) {
      if (err.response?.status === 409) {
        setMessage('이미 사용 중인 이메일입니다.')
      } else {
        setMessage('회원가입 실패')
      }
    }
  }

  const handleLogin = async () => {
    try {
      const res = await axios.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      navigate('/dashboard')
    } catch (err) {
      setMessage('로그인 실패: 이메일 또는 비밀번호를 확인하세요.')
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>회원가입 / 로그인</h2>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br /><br />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br /><br />
        <button type="submit">회원가입</button>
        &nbsp;&nbsp;
        <button type="button" onClick={handleLogin}>로그인</button>
      </form>

      {message && <p>{message}</p>}

      {showConfirm && (
        <div>
          <p>로그인 하시겠습니까?</p>
          <button onClick={handleLogin}>네</button>
          &nbsp;&nbsp;
          <button onClick={() => setShowConfirm(false)}>아니요</button>
        </div>
      )}
    </div>
  )
}

export default Signup
