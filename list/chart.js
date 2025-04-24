import { drawBloodPressureChart } from './bpchart.js';
export { drawBloodPressureChart };

export function drawChartPopup(label, dates, valuesMap) {
  // 모달 먼저 표시
  document.getElementById("chartTitle").textContent = `${label} 변화`;
  document.getElementById("chartModal").style.display = "block";

  setTimeout(() => {
    const ctx = document.getElementById("chartCanvas").getContext("2d");

    // 기존 차트 제거
    if (window.currentChart) window.currentChart.destroy();

    const data = dates.map(date => {
      const val = valuesMap[date];
      if (!val) return null;
      const parsed = parseFloat(val?.replace(/[^\d.]/g, ""));
      return isNaN(parsed) ? null : parsed;
    }).filter(d => d !== null);

    const chartType = label === "혈압(최고/최저)" ? 'scatter' : 'line';

    // 차트 생성
    window.currentChart = new Chart(ctx, {
      type: chartType,
      data: {
        labels: label === "혈압(최고/최저)" ? undefined : dates,
        datasets: [{
          label: label,
          data: data,
          borderColor: '#007bff',
          backgroundColor: label === "혈압(최고/최저)"
            ? 'rgba(0,123,255,0.3)'
            : 'rgba(0,123,255,0.1)',
          fill: true,
          pointBackgroundColor: label === "혈압(최고/최저)" ? '#007bff' : undefined,
          pointRadius: label === "혈압(최고/최저)" ? 6 : undefined,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: `${label} 변화 그래프` }
        },
        scales: {
          y: { beginAtZero: false },
          x: label === "혈압(최고/최저)" ? {
            type: 'linear',
            position: 'bottom',
            title: { display: true, text: '수축기 혈압 (SBP)' },
            min: 80,
            max: 200
          } : undefined
        }
      }
    });

    document.getElementById("closeChartBtn").onclick = () => {
      document.getElementById("chartModal").style.display = "none";
    };
  }, 50); // 모달 띄운 후 약간의 지연
}
