export const dataMap = {};
export const allDates = new Set();
export const bloodPressureMap = {};  // SBP + DBP → 혈압(최고/최저) 으로 통합

export async function loadXmlAndProcess(renderTable) {
  try {
    const xmlUrl = './mom.xml';
    const res = await fetch(xmlUrl);
    const xmlStr = await res.text();
    processXML(xmlStr, renderTable);
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

    return;  // 여기서 바로 끝내므로, 나머지 코드 실행하지 않음
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
function processXML(xmlStr, renderTable) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlStr, "application/xml");

  const results = [...xml.getElementsByTagName("*")].filter(el => el.localName === "Result");

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

  dataList.forEach(({ label, date, value, unit }) => {
    if (!dataMap[label]) dataMap[label] = {};
    dataMap[label][date] = unit ? `${value} ` : value;
    allDates.add(date);
  });
  //console.log("Updated dataMap after processing XML:", dataMap); 
  mergeBloodPressure(dataMap);  // 혈압 병합 후 데이터를 업데이트

  renderTable();  // 테이블 새로 렌더링
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
