import { renderTable } from './tableRenderer.js';
import { initUserData, initHospitalOnlyData, getAllDataMap  } from './dataHandler.js';
import { loadXmlAndProcess, 
        mergeBloodPressure, 
        dataMap, 
        triggerFileInput, 
        createFileUploadHandler  } from './xmlLoader.js';
import { drawBloodPressureChart  } from './chart.js';


initUserData();               // 사용자 입력 데이터 (customDataBatch)
initHospitalOnlyData();       //XML 병원명 데이터 (hospitalOnlyData)

mergeBloodPressure(dataMap);  //사용자 입력 혈압 병합 적용

renderTable();                //테이블 렌더링
loadXmlAndProcess(renderTable); 

//파일 추가하기 버튼
window.triggerFileInput = triggerFileInput;
document.getElementById("fileUpload").addEventListener("change", createFileUploadHandler(renderTable));

//혈압그래프
const allData = getAllDataMap();
window.handleShowBPChart = () => {
    const dataMap = getAllDataMap(); 
    const bpMap = dataMap["혈압(최고/최저)"];
    if (bpMap) {
      drawBloodPressureChart(bpMap);  
    } else {
      alert("혈압 데이터가 없습니다.");
    }
  };