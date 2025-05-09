import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axiosInstance'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  // ✅ 로그인한 사용자라면 로그인 페이지 접근 차단
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/dashboard')
    }
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      setMessage('이메일과 비밀번호를 입력하세요.')
      return
    }

    try {
      const res = await axios.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      navigate('/dashboard') // ✅ 로그인 성공 후 이동
    } catch (err) {
      if (err.response?.status === 401) {
        setMessage('비밀번호가 틀렸습니다.')
      } else if (err.response?.status === 404) {
        setMessage('가입된 이메일이 없습니다.')
      } else {
        setMessage('로그인 실패')
      }
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>로그인</h2>
      <form onSubmit={handleLogin}>
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
        <button type="submit">로그인</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}

export default Login
