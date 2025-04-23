import { dataMap, allDates, mergeBloodPressure  } from './xmlLoader.js';
import { renderTable } from './tableRenderer.js'; 

export const userEnteredLabels = new Set();
export const userEnteredCells = new Set();
export const hospitalByDate = {};

// 초기 사용자 데이터 로딩 (localStorage → 메모리)
export function initUserData() {
  const allCustom = JSON.parse(localStorage.getItem("customDataBatch") || "[]");

  allCustom.forEach(({ date, hospital, entries }) => {
    if (hospital) hospitalByDate[date] = hospital;

    entries.forEach(({ label, value }) => {
      if (!dataMap[label]) dataMap[label] = {};
      dataMap[label][date] = value;
      allDates.add(date);
      userEnteredLabels.add(label);
      userEnteredCells.add(`${label}||${date}`);
    });
  });
}

//사용자 입력데이터 localStorage에 저장
export function updateLocalStorage(label, date, newValue) {
  const allCustom = JSON.parse(localStorage.getItem("customDataBatch") || "[]");

  allCustom.forEach(entry => {
    if (entry.date === date) {
      if (label === "혈압(최고/최저)") {
        const match = newValue.match(/^(\d+)\s*\/\s*(\d+)$/);
        if (match) {
          const SBP = match[1];
          const DBP = match[2];
          
          // SBP와 DBP를 각각 저장
          const sbpEntry = entry.entries.find(e => e.label === "SBP");
          const dbpEntry = entry.entries.find(e => e.label === "DBP");

          if (sbpEntry) sbpEntry.value = SBP;
          if (dbpEntry) dbpEntry.value = DBP;
        }
      } else {
        const target = entry.entries.find(e => e.label === label);
        if (target) {
          target.value = newValue;
        }
      }
    }
  });
  localStorage.setItem("customDataBatch", JSON.stringify(allCustom));
   // 혈압 병합 처리
   mergeBloodPressure(allCustom);
}

// 사용자 입력데이터 localStorage에 삭제
export function removeFromLocalStorage(label, date) {
  let allCustom = JSON.parse(localStorage.getItem("customDataBatch") || "[]");

  allCustom = allCustom.map(entry => {
    if (entry.date === date) {
      if (label === "혈압(최고/최저)") {
        // SBP와 DBP 삭제
        entry.entries = entry.entries.filter(e => e.label !== "SBP" && e.label !== "DBP");
      } else {
        entry.entries = entry.entries.filter(e => e.label !== label);
      }
    }
    return entry;
  }).filter(entry => entry.entries.length > 0); 

  localStorage.setItem("customDataBatch", JSON.stringify(allCustom));

 // 혈압 병합 처리
  mergeBloodPressure(allCustom);

  const stillExists = allCustom.some(e => e.date === date);
  if (!stillExists) {
    delete hospitalByDate[date];
  }

  renderTable();  
}


// 병원명 업데이트
export function updateHospitalInLocalStorage(date, hospitalName) {
  const allCustom = JSON.parse(localStorage.getItem("customDataBatch") || "[]");
  const entry = allCustom.find(entry => entry.date === date);

  if (entry) {
    entry.hospital = hospitalName;
  } else {
    allCustom.push({
      date,
      hospital: hospitalName,
      entries: []
    });
  }

  localStorage.setItem("customDataBatch", JSON.stringify(allCustom));
  hospitalByDate[date] = hospitalName; 
}

// 병원명 삭제
export function removeHospitalFromLocalStorage(date) {
  const allCustom = JSON.parse(localStorage.getItem("customDataBatch") || "[]");

  allCustom.forEach(entry => {
    if (entry.date === date) {
      delete entry.hospital;
    }
  });

  localStorage.setItem("customDataBatch", JSON.stringify(allCustom));
  delete hospitalByDate[date];
}

//XML 데이터용 병원명 로드
export function initHospitalOnlyData() {
  const xmlHospitalData = JSON.parse(localStorage.getItem("hospitalOnlyData") || "{}");
  for (const [date, hospital] of Object.entries(xmlHospitalData)) {
    if (hospital) hospitalByDate[date] = hospital;
  }
}

//병원명 저장 (XML용)
export function saveHospitalOnly(date, hospitalName) {
  const stored = JSON.parse(localStorage.getItem("hospitalOnlyData") || "{}");
  stored[date] = hospitalName;
  localStorage.setItem("hospitalOnlyData", JSON.stringify(stored));
  hospitalByDate[date] = hospitalName;
}

// 병원명 삭제 (XML용)
export function deleteHospitalOnly(date) {
  const stored = JSON.parse(localStorage.getItem("hospitalOnlyData") || "{}");
  delete stored[date];
  localStorage.setItem("hospitalOnlyData", JSON.stringify(stored));
  delete hospitalByDate[date];
}


//혈압그래프......
export function getAllDataMap() {
  const allCustom = JSON.parse(localStorage.getItem("customDataBatch") || "[]");
  
  return allCustom;
}