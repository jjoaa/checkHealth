Chart.register(window['chartjs-plugin-annotation']);
import { dataMap } from './xmlLoader.js';

export function drawBloodPressureChart() {
  // 1. 모달 먼저 보여주기
  document.getElementById("chartTitle").textContent = `혈압(최고/최저) 변화`;
  document.getElementById("chartModal").style.display = "block";

  // 2. Chart 렌더링은 약간 지연 후 (크기 문제 방지)
  setTimeout(() => {
    const ctx = document.getElementById("chartCanvas").getContext("2d");

    // 🔥 기존 차트 제거
    if (window.currentChart) window.currentChart.destroy();

    const mergedData = [];
    const sbpMap = dataMap["SBP"] || {};
    const dbpMap = dataMap["DBP"] || {};

    for (const date of Object.keys(sbpMap)) {
      const sbp = parseInt(sbpMap[date], 10);
      const dbp = parseInt(dbpMap[date], 10);
      if (!isNaN(sbp) && !isNaN(dbp)) {
        mergedData.push({ date, SBP: sbp, DBP: dbp });
      }
    }

    // ✅ 새 차트 생성
    window.currentChart = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [{
        label: "혈압 측정값",
        data: mergedData.map(d => ({
          x: d.DBP,
          y: d.SBP,
          label: d.date,
          bloodPressure: `${d.SBP} / ${d.DBP}`
        })),
      backgroundColor: "rgba(0, 0, 255, 1)",  // 💙 완전한 파란색
      borderColor: "#003366",                // 🔵 짙은 파란색 테두리
      borderWidth: 2,                        // 테두리 두께
      pointRadius: 5,
      pointHoverRadius: 8,
      order: 0,
      pointStyle: 'circle' 
      }]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: context => {
              const point = context.raw;
              return `${point.label} : ${point.bloodPressure}`;
            }
          }
        },
        annotation: {
            annotations: {
              hypertension2: {
                type: 'box',
                order: 4, 
                xMin: 50,
                xMax: 120,
                yMin: 80,
                yMax: 200,
                backgroundColor: 'rgba(255, 99, 132, 0.4)', // red-pink
                borderWidth: 0,
                label: {
                  content: '고혈압 2기',
                  enabled: true,
                  position: 'end',
                  xAdjust: -50,
                  yAdjust: -320,
                  color: '#990000'
                }
              },    
              hypertension1: {
                type: 'box',
                order: 3, 
                xMin: 50,
                xMax: 100,
                yMin: 80,
                yMax: 160,
                backgroundColor: 'rgba(255, 165, 0, 0.3)', // orange
                borderWidth: 0,
                label: {
                  content: '고혈압 1기',
                  enabled: true,
                  position: 'end',
                  xAdjust: -10,
                  yAdjust: -210,
                  color: 'rgba(85, 69, 54, 0.94)'
                }
              },
              prehypertension: {
                type: 'box',
                order: 2, 
                xMin: 50,
                xMax: 90,
                yMin: 80,
                yMax: 140,
                backgroundColor: 'rgba(236, 234, 85, 0.3)', // yellow
                borderWidth: 0,
                label: {
                  content: '고혈압 전단계',
                  enabled: true,
                  position: 'end',
                  xAdjust: -3,
                  yAdjust: -150,
                  color: 'rgba(85, 69, 54, 0.94)'
                }
              },
              normal: {
                type: 'box',
                order: 1, 
                xMin: 50,
                xMax: 80,
                yMin: 80,
                yMax: 120,
                backgroundColor: 'rgba(144, 238, 144, 0.4)', // light green
                borderWidth: 0,
                label: {
                  content: '정상',
                  enabled: true,
                  position: 'center',
                  color: '#006600'
                }
              },
            }
          },
        legend: { position: "top" }
      },
      scales: {
        x: {
          title: { display: true, text: "이완기 혈압 (DBP)" },
          min: 50,
          max: 120
        },
        y: {
          title: { display: true, text: "수축기 혈압 (SBP)" },
          min: 80,
          max: 200
        }
      }
    },
    plugins: [Chart.registry.getPlugin('annotation')]
  });

  // 닫기 버튼
  document.getElementById("closeChartBtn").onclick = () => {
    document.getElementById("chartModal").style.display = "none";
  };
}, 50); // 🔁 지연 후 렌더링
}
