import { renderTable } from './tableRenderer.js';
import { initUserData, initHospitalOnlyData, getAllDataMap } from './dataHandler.js';
import { loadXmlAndProcess, mergeBloodPressure, dataMap, triggerFileInput, createFileUploadHandler } from './xmlLoader.js';

// 비동기 초기화 함수
async function initialize() {
    try {
        console.log('Starting initialization...');
        
        // MongoDB에서 데이터 로드
        //console.log('Loading user data...');
        await initUserData();
        //console.log('User data loaded');
        
        //console.log('Loading hospital data...');
        await initHospitalOnlyData();
        //console.log('Hospital data loaded');

        // 혈압 데이터 병합
        console.log('Merging blood pressure data...');
        mergeBloodPressure(dataMap);
        //console.log('Blood pressure data merged');

        // 테이블 렌더링
        //console.log('Rendering table...');
        renderTable();
        console.log('Table rendered');

        // XML 데이터 로드 (선택적)
        try {
            console.log('Loading XML data...');
            await loadXmlAndProcess(renderTable);
            console.log('XML data loaded');
        } catch (error) {
            console.warn('XML data loading skipped or failed:', error);
        }

        console.log('Initialization completed successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// 페이지 로드 완료 후 초기화 실행
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting initialization...');
    initialize();
    
    // 전역 함수로 등록
    window.triggerFileInput = triggerFileInput;
    
    // 파일 업로드 이벤트 리스너 등록
    const fileUploadHandler = createFileUploadHandler(renderTable);
    document.getElementById('fileUpload').addEventListener('change', fileUploadHandler);
});

// 파일 업로드 관련 함수들을 전역 스코프에 추가
window.handleFileUpload = async function(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        // Process the XML file
        const fileHandler = createFileUploadHandler(renderTable);
        fileHandler(event);
        
        // Merge blood pressure data after processing
        mergeBloodPressure(dataMap);
        
        // Refresh data from MongoDB
        await initUserData();
        
        alert('파일이 성공적으로 처리되었습니다.');
      } catch (error) {
        console.error('Error processing XML:', error);
        alert('XML 처리 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  } catch (error) {
    console.error('File processing error:', error);
    alert('파일 처리 중 오류가 발생했습니다.');
  }
};

// 파일 업로드 이벤트 리스너 등록
document.getElementById('fileUpload').addEventListener('change', window.handleFileUpload);
