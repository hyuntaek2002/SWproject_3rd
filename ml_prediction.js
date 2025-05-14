// ml_prediction.js - 수정된 버전

const { spawn } = require('child_process');
const db = require('../models/db');
const path = require('path');
const fs = require('fs');

// 머신러닝 기반 지출 예측
exports.predictSpendingML = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ message: 'user_id는 필수입니다.' });

  try {
    // 과거 지출 데이터 가져오기
    const sql = `
      SELECT 
        DATE_FORMAT(transaction_date, '%Y-%m') AS month,
        ROUND(SUM(amount)) AS total
      FROM transactions
      WHERE 
        user_id = ?
        AND type = 'expense'
        AND transaction_date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 12 MONTH), '%Y-%m-01')
      GROUP BY month
      ORDER BY month ASC;
    `;

    db.query(sql, [user_id], async (err, rows) => {
      if (err) return res.status(500).json({ error: err });

      // 데이터가 너무 적으면 예측이 어려움
      if (rows.length < 3) {
        return res.status(400).json({ 
          message: '예측을 위한 충분한 데이터가 없습니다. 최소 3개월 이상의 지출 데이터가 필요합니다.',
          history: rows,
          prediction: null
        });
      }

      console.log(`사용자 ID ${user_id}의 지출 데이터 ${rows.length}개 항목 검색됨`);

      // temp 디렉토리 생성 확인
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        console.log(`임시 디렉토리 생성: ${tempDir}`);
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // 임시 JSON 파일로 데이터 저장
      const tempDataFile = path.join(tempDir, `expense_data_${user_id}.json`);
      
      try {
        fs.writeFileSync(tempDataFile, JSON.stringify(rows));
        console.log(`임시 데이터 파일 생성됨: ${tempDataFile}`);
      } catch (fileError) {
        console.error(`임시 파일 생성 오류: ${fileError.message}`);
        return res.status(500).json({ 
          error: '임시 파일 생성 실패', 
          detail: fileError.message,
          history: rows,
          prediction: null
        });
      }

      // Python 명령 설정 (OS에 따라 다르게)
      let pythonCommand = 'python';
      if (process.platform !== 'win32') {
        pythonCommand = 'python3';
      }
      
      const scriptPath = path.join(__dirname, '../ml/predict_spending.py');
      console.log(`Python 스크립트 실행: ${pythonCommand} ${scriptPath} ${tempDataFile}`);

      // Python 스크립트 실행
      const pythonProcess = spawn(pythonCommand, [scriptPath, tempDataFile]);

      let prediction = '';
      let pythonError = '';

      pythonProcess.stdout.on('data', (data) => {
        prediction += data.toString();
        console.log(`Python 출력: ${data.toString().trim()}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        pythonError += data.toString();
        console.error(`Python 오류: ${data.toString().trim()}`);
      });

      pythonProcess.on('close', (code) => {
        console.log(`Python 프로세스 종료 코드: ${code}`);
        
        // 임시 파일 삭제 (안전하게)
        try {
          if (fs.existsSync(tempDataFile)) {
            fs.unlinkSync(tempDataFile);
            console.log(`임시 파일 삭제됨: ${tempDataFile}`);
          } else {
            console.warn(`임시 파일이 존재하지 않음: ${tempDataFile}`);
          }
        } catch (unlinkError) {
          console.warn(`임시 파일 삭제 실패: ${unlinkError.message}`);
          // 파일 삭제 실패는 치명적 오류가 아님, 계속 진행
        }

        if (code !== 0) {
          console.error('Python 실행 오류:', pythonError);
          return res.status(500).json({ 
            error: 'ML 예측 실패', 
            detail: pythonError,
            history: rows,
            prediction: null
          });
        }

        try {
          // 예측 결과 검증
          const predictionStr = prediction.trim();
          console.log(`예측 결과 문자열: "${predictionStr}"`);
          
          if (!predictionStr) {
            throw new Error('Python 스크립트가 예측 결과를 반환하지 않았습니다');
          }
          
          const predictionValue = parseFloat(predictionStr);
          
          if (isNaN(predictionValue)) {
            throw new Error(`예측 결과를 숫자로 변환할 수 없습니다: ${predictionStr}`);
          }
          
          // 예측 결과가 음수일 경우 0으로 보정
          const finalPrediction = predictionValue < 0 ? 0 : Math.round(predictionValue);
          console.log(`최종 예측 금액: ${finalPrediction}`);

          res.status(200).json({
            message: '머신러닝 기반 예측 성공',
            method: 'machine_learning',
            history: rows,
            prediction: finalPrediction
          });
        } catch (parseError) {
          console.error('예측 결과 파싱 오류:', parseError);
          res.status(500).json({ 
            error: '예측 결과 파싱 실패', 
            detail: parseError.message,
            history: rows,
            prediction: null
          });
        }
      });
    });
  } catch (error) {
    console.error('머신러닝 예측 오류:', error);
    res.status(500).json({ error: '머신러닝 예측 실패', detail: error.message });
  }
};