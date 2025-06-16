import { initUserData } from './dataHandler.js';

export const dataMap = {};
export const allDates = new Set();
export const bloodPressureMap = {};  // SBP + DBP → 혈압(최고/최저) 으로 통합

const API_BASE_URL = 'http://localhost:3001/api';

export async function loadXmlAndProcess(renderTable) {
  try {
  } catch (err) {
    console.warn("기본 mom.xml 파일 없음 또는 오류:", err);
  }
}

export function mergeBloodPressure(optionalCustom = null) {
  let allCustom = optionalCustom;

  // allCustom이 없으면 dataMap에서 merge 시도
  if (!Array.isArray(allCustom)) {
    allCustom = [];

    // SBP, DBP 데이터가 있는 경우만 병합
    const sbpMap = dataMap["SBP"] || {};
    const dbpMap = dataMap["DBP"] || {};

    // SBP, DBP 모두 있는 날짜를 찾아 병합
    const allDatesSet = new Set([...Object.keys(sbpMap), ...Object.keys(dbpMap)]);
    for (const date of allDatesSet) {
      const sbp = sbpMap[date];
      const dbp = dbpMap[date];
      if (sbp && dbp) {
        if (!dataMap["혈압(최고/최저)"]) dataMap["혈압(최고/최저)"] = {};
        dataMap["혈압(최고/최저)"][date] = `${sbp}/${dbp}`;
      }
    }

    return; 
  }

  // 사용자 입력 기반 병합
  for (const entry of allCustom) {
    if (!Array.isArray(entry.entries)) continue;

    const sbpEntry = entry.entries.find(e => e.label === "SBP");
    const dbpEntry = entry.entries.find(e => e.label === "DBP");

    // SBP, DBP가 둘 다 있는 경우 병합
    if (sbpEntry && dbpEntry) {
      const date = entry.date;
      const mergedValue = `${sbpEntry.value}/${dbpEntry.value}`;
      if (!dataMap["혈압(최고/최저)"]) dataMap["혈압(최고/최저)"] = {};
      dataMap["혈압(최고/최저)"][date] = mergedValue;
    }
  }
}

// XML 파싱 및 데이터 저장 함수
async function processXML(xmlStr, renderTable) {
  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlStr, "application/xml");
    const results = [...xml.getElementsByTagName("*")].filter(el => el.localName === "Result");
    
    console.log('Found XML results:', results.length);

    // 날짜별로 데이터 그룹화
    const dateGroups = {};

    const dataList = results.map(result => {
      const getText = tag =>
        [...result.getElementsByTagName("*")].find(e => e.localName === tag)?.textContent.trim() || "";

      return {
        label: getText("Description"),
        date: getText("ExactDateTime"),
        value: getText("Value"),
        unit: getText("Unit")
      };
    }).filter(item => item.label && item.date && item.value);

    console.log('Processed data list:', dataList);

    // 날짜별로 데이터 그룹화
    dataList.forEach(item => {
      const date = item.date.split('T')[0]; // YYYY-MM-DD 형식으로 변환
      if (!dateGroups[date]) {
        dateGroups[date] = [];
      }
      dateGroups[date].push({
        label: item.label,
        value: item.value,
        //unit: item.unit
      });

      // 기존 dataMap 업데이트도 유지
      if (!dataMap[item.label]) dataMap[item.label] = {};
      dataMap[item.label][date] = item.unit ? `${item.value} ${item.unit}` : item.value;
      allDates.add(date);
    });

    console.log('Grouped data by date:', dateGroups);

    // MongoDB에 저장할 데이터 형식으로 변환 (customData 형식에 맞춤)
    const mongoData = Object.entries(dateGroups).map(([date, records]) => ({
      date,
      records
    }));

    console.log('Preparing to send to MongoDB:', mongoData);

    try {
      // API를 통해 데이터 저장
      console.log('Sending data to server...');
      const response = await fetch(`${API_BASE_URL}/xml-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mongoData)
      });

      console.log('Server response status:', response.status);
      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (!response.ok) {
        throw new Error(`Failed to save XML data: ${responseData.error || 'Unknown error'}`);
      }

      // 데이터가 저장된 후 화면 새로고침을 위해 데이터 다시 로드
      await initUserData();  // list.js에서 import 필요
      console.log('XML data successfully saved and view refreshed');
    } catch (error) {
      console.error('Network or server error:', error);
      throw error;
    }

    mergeBloodPressure(dataMap);
    renderTable();
  } catch (error) {
    console.error('Error in processXML:', error);
    throw error;
  }
}

//파일추가하기
export function triggerFileInput() {
  document.getElementById("fileUpload").click();
}

export function createFileUploadHandler(renderTable) {
  return function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      processXML(e.target.result, renderTable);
    };
    reader.readAsText(file);
  };
}
