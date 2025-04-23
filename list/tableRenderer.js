import { dataMap, allDates, mergeBloodPressure } from './xmlLoader.js';
import { drawChartPopup } from './chart.js'; 
import { 
  initUserData ,
  userEnteredLabels, 
  userEnteredCells, 
  updateLocalStorage, 
  removeFromLocalStorage, 
  hospitalByDate, 
  saveHospitalOnly, 
  deleteHospitalOnly 
} from './dataHandler.js';



export function renderTable() {

  console.log("Rendering table with dataMap:", JSON.stringify(dataMap, null, 2)); 
  const sortedDates = Array.from(allDates).sort();

  const categoryMap = {
    "계측검사": ["신장", "체중", "허리둘레", "BMI", "시력(좌)", "시력(우)", "청력(좌/우)", "혈압(최고/최저)"],
    "요검사": ["요단백"],
    "혈액검사": [
      "혈색소", "공복혈당", "총콜레스테롤", "HDL 콜레스테롤", "트리글리세라이드",
      "LDL콜레스테롤", "혈청크레아티닌", "신사구체여과율(GFR)", "AST(SGOT)", "ALT(SGPT)", "감마지티피"
    ]
  };

  const itemToCategory = {};
  Object.entries(categoryMap).forEach(([cat, items]) => {
    items.forEach(item => itemToCategory[item] = cat);
  });

  function isOutOfRange(label, value) {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    const ranges = {
      "공복혈당": v => v < 70 || v > 99,
      "총콜레스테롤": v => v >= 200,
      "HDL 콜레스테롤": v => v < 40,
      "LDL콜레스테롤": v => v >= 130,
      "혈색소": v => v < 13 || v > 17,
      "감마지티피": v => v > 63
    };
    const check = ranges[label];
    return check ? check(num) : false;
  }

  const thead = document.querySelector("#result-table thead");
  thead.innerHTML = "";

  const dateRow = document.createElement("tr");
  dateRow.innerHTML = "<th rowspan='2'>구분</th><th rowspan='2'>항목</th>";
  sortedDates.forEach(date => {
    const th = document.createElement("th");
    th.textContent = date;
    dateRow.appendChild(th);
  });
  dateRow.innerHTML += "<th rowspan='2'>그래프</th>";
  thead.appendChild(dateRow);

  //병원명 추가
  const hospitalRow = document.createElement("tr");
sortedDates.forEach(date => {
  const th = document.createElement("th");
  th.style.fontSize = "0.85em";
  th.style.color = "#666";
  th.style.position = "relative";

  const hospital = hospitalByDate[date];

  if (hospital) {
    const span = document.createElement("span");
    span.textContent = hospital;

    const editBtn = document.createElement("span");
    editBtn.textContent = " ✏️";
    editBtn.style.cursor = "pointer";
    editBtn.onclick = () => {
      const edited = prompt(`${date} 병원명 수정`, hospital);
      if (edited !== null && edited.trim() !== "") {
        saveHospitalOnly(date, edited.trim()); 
        renderTable();
      }
    };

    const deleteBtn = document.createElement("span");
    deleteBtn.textContent = " ❌";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.onclick = () => {
      deleteHospitalOnly(date); 
      window.dispatchEvent(new Event("storage")); 
      renderTable();
    };

    th.appendChild(span);
    th.appendChild(editBtn);
    th.appendChild(deleteBtn);
  } else if (!userEnteredCells.has(`dummy||${date}`)) {

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "병원명 입력";
    input.style.width = "70%";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "💾";
    saveBtn.onclick = () => {
      const val = input.value.trim();
      if (val) {
        saveHospitalOnly(date, val); 
        renderTable();
      }
    };

    th.appendChild(input);
    th.appendChild(saveBtn);
  } else {
    th.textContent = "-"; // 사용자 입력 데이터는 병원명 필드 없음
  }

  hospitalRow.appendChild(th);
});
thead.appendChild(hospitalRow);


  const tbody = document.querySelector("#result-table tbody");
  tbody.innerHTML = "";

  const categories = ["계측검사", "요검사", "혈액검사", "기타"];
  categories.forEach(category => {
    const items = Object.keys(dataMap).filter(label => {
      const cat = itemToCategory[label] || "기타";
      return cat === category;
    });

    if (items.length === 0) return;

    let first = true;
    items.forEach(label => {
      const tr = document.createElement("tr");

      if (first) {
        const catTd = document.createElement("td");
        catTd.textContent = category;
        catTd.rowSpan = items.length;
        tr.appendChild(catTd);
        first = false;
      }

      const labelTd = document.createElement("td");
      labelTd.textContent = label;
      tr.appendChild(labelTd);

      sortedDates.forEach(date => {
        const td = document.createElement("td");
        const val = dataMap[label][date] || "-";
        td.textContent = val;
        td.style.position = "relative";

        if (isOutOfRange(label, val)) {
          td.style.color = "red";
        }

        const cellKey = `${label}||${date}`;

const hasUserInput =
  userEnteredCells.has(cellKey) ||
  (label === "혈압(최고/최저)" && (
    userEnteredCells.has(`SBP||${date}`) || userEnteredCells.has(`DBP||${date}`)
  ));

if (hasUserInput) {
  // ✏️ 수정 버튼
  const editBtn = document.createElement("span");
  editBtn.textContent = " ✏️";
  editBtn.style.cursor = "pointer";
  editBtn.onclick = () => {
    if (label === "혈압(최고/최저)") {
      const current = dataMap[label]?.[date] ?? "";
      const edited = prompt(`${label} (${date}) 값 수정`, current);
      const match = edited?.match(/^(\d+)\s*\/\s*(\d+)$/);
      if (match) {
        const sbp = match[1];
        const dbp = match[2];

        dataMap["SBP"] ??= {};
        dataMap["DBP"] ??= {};
        dataMap["SBP"][date] = sbp;
        dataMap["DBP"][date] = dbp;

        userEnteredCells.add(`SBP||${date}`);
        userEnteredCells.add(`DBP||${date}`);

        updateLocalStorage("SBP", date, sbp);
        updateLocalStorage("DBP", date, dbp);

        mergeBloodPressure(dataMap); 
        renderTable(); 
      } else {
        alert("혈압은 '120/80' 형식으로 입력해주세요.");
      }
    } else {
      const edited = prompt(`${label} (${date}) 값 수정`, val);
      if (edited !== null && edited.trim() !== "") {
        dataMap[label][date] = edited.trim();
        userEnteredCells.add(cellKey);
        updateLocalStorage(label, date, edited.trim());
        renderTable(); // 즉시 테이블을 갱신
      }
    }
  };
  td.appendChild(editBtn);

  // ❌ 삭제 버튼
  const deleteBtn = document.createElement("span");
  deleteBtn.textContent = " ❌";
  deleteBtn.style.cursor = "pointer";
  deleteBtn.onclick = () => {
    console.log("사용자 입력 라벨들:", [...userEnteredLabels]);
    if (label === "혈압(최고/최저)") {
   
      delete dataMap["SBP"]?.[date];
      delete dataMap["DBP"]?.[date];
      userEnteredCells.delete(`SBP||${date}`);
      userEnteredCells.delete(`DBP||${date}`);
      removeFromLocalStorage("SBP", date);
      removeFromLocalStorage("DBP", date);
    
   
      if (dataMap["SBP"] && Object.keys(dataMap["SBP"]).length === 0) {
        delete dataMap["SBP"];
        userEnteredLabels.delete("SBP");
      }
      if (dataMap["DBP"] && Object.keys(dataMap["DBP"]).length === 0) {
        delete dataMap["DBP"];
        userEnteredLabels.delete("DBP");
      }
   
      if (dataMap["혈압(최고/최저)"] && dataMap["혈압(최고/최저)"][date]) {
        delete dataMap["혈압(최고/최저)"][date];
      }
    

      if (dataMap["혈압(최고/최저)"] && Object.keys(dataMap["혈압(최고/최저)"]).length === 0) {
        delete dataMap["혈압(최고/최저)"];
        userEnteredLabels.delete("혈압(최고/최저)");
      }
    
      mergeBloodPressure(dataMap);
    
    } else {
      // 일반 항목 삭제
      delete dataMap[label][date];
      userEnteredCells.delete(cellKey);
      removeFromLocalStorage(label, date);
    
      if (dataMap[label] && Object.keys(dataMap[label]).length === 0) {
        delete dataMap[label];
        userEnteredLabels.delete(label);
      }
    
      if (label === "혈압(최고/최저)") {
        mergeBloodPressure(dataMap);
      }
    }
    
    renderTable(); 

  };
  td.appendChild(deleteBtn);
}

        tr.appendChild(td);
      });

      const btnTd = document.createElement("td");
      const viewBtn = document.createElement("button");
      viewBtn.textContent = "보기";
      viewBtn.onclick = () => drawChartPopup(label, sortedDates, dataMap[label]);
      btnTd.appendChild(viewBtn);
      tr.appendChild(btnTd);

      tbody.appendChild(tr);
    });
  });
}

