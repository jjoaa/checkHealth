export const dataMap = {};
export const allDates = new Set();
export const bloodPressureMap = {}; 

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



export function mergeBloodPressure(dataMap) {
  ["SBP", "DBP"].forEach(key => {
    if (!dataMap[key]) return; 
    Object.entries(dataMap[key]).forEach(([date, value]) => {
      if (!bloodPressureMap[date]) bloodPressureMap[date] = {}; 
      bloodPressureMap[date][key] = value; 
    });
    delete dataMap[key]; 
  });

  dataMap["혈압(최고/최저)"] = {};
  Object.entries(bloodPressureMap).forEach(([date, bp]) => {
    const sbp = parseFloat(bp["SBP"]?.replace(/[^\d.]/g, ""));
    const dbp = parseFloat(bp["DBP"]?.replace(/[^\d.]/g, ""));
    if (!isNaN(sbp) && !isNaN(dbp)) {
      dataMap["혈압(최고/최저)"][date] = `${sbp} / ${dbp}`; 
    }
  });
  console.log("Updated dataMap after mergeBloodPressure:", JSON.stringify(dataMap, null, 2));
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
  mergeBloodPressure(dataMap); 
  renderTable();  
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