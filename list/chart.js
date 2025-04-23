// 혈압 차트를 그리는 함수 (혈압은 SBP/DBP 형식으로 점 그래프)
// label: '혈압(최고/최저)', dates: 날짜 배열, valuesMap: 날짜별 혈압 데이터 맵
export function drawBloodPressureChart(bloodPressureMap) {
  const ctx = document.getElementById("chartCanvas").getContext("2d");

  if (window.currentChart) window.currentChart.destroy();

  // bloodPressureMap이 제대로 전달되었는지 확인하는 로그
  console.log("Received bloodPressureMap:", bloodPressureMap);

  // bloodPressureMap이 비어 있거나 잘못 전달되었을 때 처리
  if (!bloodPressureMap || Object.keys(bloodPressureMap).length === 0) {
    console.error("혈압 데이터가 없습니다. 확인해 주세요.");
    alert("혈압 데이터가 없습니다.");
    return;
  }

  // 데이터를 X축(SBP)과 Y축(DBP)으로 매핑
  const data = Object.entries(bloodPressureMap)
    .map(([date, value]) => {
      // value가 문자열로 올바른 형식인지 확인하고 정규식 테스트
      console.log("Processing value:", value);

      const match = value.match(/^(\d+)\s*\/\s*(\d+)$/);
      if (!match) {
        console.log("Match failed for value:", value);
        return null;  // 잘못된 형식은 무시
      }

      const sbp = parseInt(match[1]);  // 수축기 혈압
      const dbp = parseInt(match[2]);  // 이완기 혈압

      console.log("SBP:", sbp, "DBP:", dbp);  // 값 확인

      return { x: sbp, y: dbp, date };
    })
    .filter(d => d !== null);  // 잘못된 데이터를 제외

  console.log("Processed data:", data);

  if (data.length === 0) {
    console.error("No valid blood pressure data to display.");
    return;
  }

  // 차트 생성
  window.currentChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: '혈압 (SBP/DBP)',
        data: data,
        parsing: false,
        pointBackgroundColor: '#007bff',
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => {
              const d = ctx.raw;
              return `날짜: ${d.date}, SBP: ${d.x}, DBP: ${d.y}`;
            }
          }
        },
        title: {
          display: true,
          text: '혈압 분포 그래프 (SBP/DBP)'
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: { display: true, text: '수축기 혈압 (SBP)' },
          min: 80,
          max: 180
        },
        y: {
          type: 'linear',
          title: { display: true, text: '이완기 혈압 (DBP)' },
          min: 40,
          max: 130
        }
      }
    }
  });

  // 모달을 띄운다
  document.getElementById("chartTitle").textContent = "혈압 분포";
  document.getElementById("chartModal").style.display = "block";


  // "닫기" 버튼 클릭 이벤트 등록
  document.getElementById("closeChartBtn").addEventListener("click", closeChart);
}

// 다른 종류의 차트를 그리는 함수 (예: 혈압 외 데이터)
// label: 차트 레이블, dates: 날짜 배열, valuesMap: 날짜별 값 맵
export function drawChartPopup(label, dates, valuesMap) {
  const ctx = document.getElementById("chartCanvas").getContext("2d");

  if (window.currentChart) window.currentChart.destroy(); // 이전 차트가 있으면 제거

  // 날짜별 값 매핑
  const data = dates.map(date => {
    const val = valuesMap[date];  // 날짜별 값
    if (!val) return null;  // 값이 없으면 null
    const parsed = parseFloat(val?.replace(/[^\d.]/g, ""));  // 숫자만 추출
    return isNaN(parsed) ? null : parsed;  // 유효한 숫자만 반환
  }).filter(d => d !== null);  // null 필터링

  const chartType = label === "혈압(최고/최저)" ? 'scatter' : 'line';  // 혈압이면 scatter, 아니면 line 차트

  // 차트 그리기
  window.currentChart = new Chart(ctx, {
    type: chartType,
    data: {
      labels: label === "혈압(최고/최저)" ? undefined : dates,  // 점 그래프에는 레이블 없음
      datasets: [{
        label: label,
        data: data,
        borderColor: '#007bff',
        backgroundColor: label === "혈압(최고/최저)" ? 'rgba(0,123,255,0.3)' : 'rgba(0,123,255,0.1)',
        fill: true,
        pointBackgroundColor: label === "혈압(최고/최저)" ? '#007bff' : undefined,  // 혈압은 점으로 표시
        pointRadius: label === "혈압(최고/최저)" ? 6 : undefined,  // 혈압 데이터 점 크기
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: `${label} 변화 그래프` }
      },
      scales: {
        y: { beginAtZero: false },  // y축은 0부터 시작하지 않음
        x: label === "혈압(최고/최저)" ? {
          type: 'linear',
          position: 'bottom',
          title: { display: true, text: '수축기 혈압 (SBP)' },  // 혈압일 경우 x축 제목
          min: 80,
          max: 200
        } : undefined  // 혈압이 아니면 x축 설정하지 않음
      }
    }
  });

  // 모달 제목 및 표시
  document.getElementById("chartTitle").textContent = `${label} 변화`;
  document.getElementById("chartModal").style.display = "block";  // 모달 표시

  // "닫기" 버튼 클릭 이벤트 등록
  document.getElementById("closeChartBtn").addEventListener("click", closeChart);
}

// 차트를 닫는 함수
function closeChart() {
  document.getElementById("chartModal").style.display = "none";  // 모달 숨기기
}
