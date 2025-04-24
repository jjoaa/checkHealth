import { renderTable } from './tableRenderer.js';
import { initUserData, initHospitalOnlyData, getAllDataMap  } from './dataHandler.js';
import { loadXmlAndProcess, 
        mergeBloodPressure, 
        dataMap, 
        triggerFileInput, 
        createFileUploadHandler  } from './xmlLoader.js';

initUserData();               // 사용자 입력 데이터 (customDataBatch)
initHospitalOnlyData();       //XML 병원명 데이터 (hospitalOnlyData)

mergeBloodPressure(dataMap);  //사용자 입력에도 혈압 병합 적용

renderTable();                //테이블 첫 렌더링
loadXmlAndProcess(renderTable);  //XML 불러오고, renderTable 재호출

//파일 추가하기 버튼
window.triggerFileInput = triggerFileInput;
document.getElementById("fileUpload").addEventListener("change", createFileUploadHandler(renderTable));

