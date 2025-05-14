#!/usr/bin/env python3
# ml/predict_spending.py - 개선된 버전

import sys
import json
import traceback
import os
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from datetime import datetime

# 디버그 로그 함수
def debug_log(message):
    """디버그 메시지를 stderr에 출력"""
    print(f"DEBUG: {message}", file=sys.stderr)

# 시계열 예측 함수
def predict_next_month_spending(data):
    debug_log(f"입력 데이터 항목 수: {len(data)}")
    
    if len(data) < 3:
        debug_log("데이터가 너무 적음 (3개 미만) - 평균값 반환")
        # 데이터가 너무 적으면 평균값 반환
        values = [float(item['total']) for item in data]
        return np.mean(values)
    
    # 날짜와 금액 추출
    dates = []
    values = []
    
    for item in data:
        month_str = item['month']
        try:
            total = float(item['total'])
        except (ValueError, TypeError):
            debug_log(f"금액 변환 오류: {item['total']} - 0으로 대체")
            total = 0.0
        
        try:
            # 날짜를 숫자로 변환 (연월을 숫자로 표현)
            date_obj = datetime.strptime(month_str, '%Y-%m')
            numeric_date = date_obj.year * 12 + date_obj.month
            
            dates.append(numeric_date)
            values.append(total)
        except ValueError:
            debug_log(f"날짜 변환 오류: {month_str} - 항목 무시")
    
    debug_log(f"유효한 데이터 항목 수: {len(dates)}")
    if len(dates) < 3:
        debug_log("유효한 데이터가 너무 적음 - 평균값 반환")
        return np.mean(values)
    
    # 데이터 전처리
    X = np.array(dates).reshape(-1, 1)
    y = np.array(values)
    
    debug_log(f"X 형태: {X.shape}, y 형태: {y.shape}")
    debug_log(f"입력 데이터 값 범위: {np.min(y)} ~ {np.max(y)}")
    
    # 스케일링
    scaler_X = StandardScaler()
    scaler_y = StandardScaler()
    
    X_scaled = scaler_X.fit_transform(X)
    y_scaled = scaler_y.fit_transform(y.reshape(-1, 1)).ravel()
    
    # 모델 학습 (Ridge 회귀 사용)
    model = Ridge(alpha=1.0)
    model.fit(X_scaled, y_scaled)
    
    # 다음 달 예측
    next_month = max(dates) + 1
    next_month_scaled = scaler_X.transform(np.array([[next_month]]))
    prediction_scaled = model.predict(next_month_scaled)
    
    # 예측값 원래 스케일로 변환
    prediction = scaler_y.inverse_transform(prediction_scaled.reshape(-1, 1)).ravel()[0]
    debug_log(f"원 예측값: {prediction}")
    
    # 계절성 효과 고려
    if len(values) >= 12:
        # 1년 전 같은 달의 지출 패턴 반영
        same_month_idx = -12
        if abs(same_month_idx) < len(values):
            last_year_same_month = values[same_month_idx]
            # 가중 평균: 모델 예측 80%, 작년 같은 달 20%
            final_prediction = 0.8 * prediction + 0.2 * last_year_same_month
            debug_log(f"계절성 적용 (작년 동월: {last_year_same_month})")
        else:
            final_prediction = prediction
    else:
        final_prediction = prediction
    
    debug_log(f"최종 예측값: {final_prediction}")
    
    # 지출 금액은 음수가 될 수 없음
    return max(0, final_prediction)

def main():
    try:
        debug_log(f"Python 버전: {sys.version}")
        debug_log(f"명령줄 인수: {sys.argv}")
        debug_log(f"현재 작업 디렉토리: {os.getcwd()}")
        
        if len(sys.argv) < 2:
            print("사용법: python predict_spending.py <데이터_파일_경로>", file=sys.stderr)
            sys.exit(1)
        
        data_file = sys.argv[1]
        debug_log(f"데이터 파일 경로: {data_file}")
        
        if not os.path.exists(data_file):
            print(f"오류: 데이터 파일이 존재하지 않습니다: {data_file}", file=sys.stderr)
            sys.exit(1)
        
        with open(data_file, 'r') as f:
            file_content = f.read()
            debug_log(f"파일 내용 길이: {len(file_content)} 바이트")
            
            if not file_content.strip():
                print("오류: 데이터 파일이 비어 있습니다", file=sys.stderr)
                sys.exit(1)
            
            data = json.loads(file_content)
            
            if not data:
                print("오류: 데이터가 비어 있습니다", file=sys.stderr)
                sys.exit(1)
        
        prediction = predict_next_month_spending(data)
        print(prediction)  # 결과를 stdout으로 출력
        sys.exit(0)
    except Exception as e:
        print(f"오류 발생: {str(e)}", file=sys.stderr)
        print(f"스택 추적: {traceback.format_exc()}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()