const db = require('../models/db')
const { getStockData } = require('../services/stockService')

// 설문 결과 저장
exports.submitSurvey = (req, res) => {
  const { risk_tolerance, investment_goal } = req.body
  const userId = req.user?.userId

  if (!risk_tolerance || !investment_goal || !userId) {
    return res.status(400).json({ message: '입력값이 부족합니다.' })
  }

  const sql = 'INSERT INTO survey_results (user_id, risk_tolerance, investment_goal) VALUES (?, ?, ?)'
  db.query(sql, [userId, risk_tolerance, investment_goal], (err, result) => {
    if (err) {
      console.error('설문 저장 실패:', err)
      return res.status(500).json({ message: '서버 오류' })
    }
    res.status(201).json({ message: '설문 저장 성공!' })
  })
}

// 여러 주식 데이터 가져오기
async function getMultipleStockData(symbols) {
  const stockResults = []

  for (const symbol of symbols) {
    const data = await getStockData(symbol)

    if (data && data['Time Series (5min)']) {
      const timeSeries = data['Time Series (5min)']
      const times = Object.keys(timeSeries)

      if (times.length >= 2) {
        const latest = timeSeries[times[0]]
        const previous = timeSeries[times[1]]

        const latestClose = parseFloat(latest['4. close'])
        const previousClose = parseFloat(previous['4. close'])

        const changePercent = ((latestClose - previousClose) / previousClose) * 100

        stockResults.push({
          symbol,
          latestClose,
          changePercent: changePercent.toFixed(2)
        })
      }
    }
  }

  return stockResults
}

// 추천 주식 응답
exports.getRecommendations = async (req, res) => {
  const userId = req.user.userId

  const sql = 'SELECT * FROM survey_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  db.query(sql, [userId], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: '서버 오류' })
    }

    if (results.length === 0) {
      return res.status(404).json({ message: '설문조사 결과가 없습니다.' })
    }

    const survey = results[0]
    const symbols = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'KO']
    const stockDataList = await getMultipleStockData(symbols)

    let recommendedStocks = []

    if (survey.risk_tolerance === '공격형') {
      recommendedStocks = stockDataList.sort((a, b) => b.changePercent - a.changePercent).slice(0, 3)
    } else if (survey.risk_tolerance === '안정형') {
      recommendedStocks = stockDataList.sort((a, b) => Math.abs(a.changePercent) - Math.abs(b.changePercent)).slice(0, 3)
    } else if (survey.risk_tolerance === '중립형') {
      recommendedStocks = stockDataList.filter(stock => Math.abs(stock.changePercent) <= 1).slice(0, 3)
    }

    res.status(200).json({
      message: '실시간 추천 주식 목록',
      investment_goal: survey.investment_goal,
      risk_tolerance: survey.risk_tolerance,
      recommendations: recommendedStocks
    })
  })
}
