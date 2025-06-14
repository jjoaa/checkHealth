import { dataMap, allDates, mergeBloodPressure } from './xmlLoader.js';
import { drawChartPopup, drawBloodPressureChart } from './chart.js'; 
import { 
  initUserData ,
  userEnteredLabels, 
  userEnteredCells, 
  updateLocalStorage, 
  removeFromLocalStorage, 
  hospitalByDate, // ✅ 이거 추가!
  saveHospitalOnly, // ✅ 병원명 저장 함수도 사용하니까 같이!
  deleteHospitalOnly // ✅ 병원명 삭제 함수도 사용하니까 같이!
} from './dataHandler.js';



export function renderTable() {

  //console.log("Rendering table with dataMap:", JSON.stringify(dataMap, null, 2)); 
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
  const isXmlData = !userEnteredCells.has(`dummy||${date}`);

  if (hospital) {
    const span = document.createElement("span");
    span.textContent = hospital;

    // XML 데이터이고 병원명이 있으면 수정/삭제 버튼 표시하지 않음
    if (!isXmlData) {
      const editBtn = document.createElement("span");
      editBtn.textContent = " ✏️";
      editBtn.style.cursor = "pointer";
      editBtn.onclick = () => {
        const edited = prompt(`${date} 병원명 수정`, hospital);
        if (edited !== null && edited.trim() !== "") {
          saveHospitalOnly(date, edited.trim()); 
        }
      };

      const deleteBtn = document.createElement("span");
      deleteBtn.textContent = " ❌";
      deleteBtn.style.cursor = "pointer";
      deleteBtn.onclick = () => {
        deleteHospitalOnly(date); 
      };

      th.appendChild(span);
      th.appendChild(editBtn);
      th.appendChild(deleteBtn);
    } else {
      th.appendChild(span);
    }
  } else if (isXmlData) {
    // XML 데이터이고 병원명이 없는 경우만 입력창 제공
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
      if (label === "SBP" || label === "DBP") return false;
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
        const isXmlData = !userEnteredCells.has(`dummy||${date}`);

        // XML 데이터가 아닌 경우에만 수정/삭제 버튼 표시
        if (!isXmlData && userEnteredCells.has(cellKey)) {
          // 수정 버튼
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
                updateLocalStorage("SBP", date, sbp);
                updateLocalStorage("DBP", date, dbp);
              } else {
                alert("혈압은 '120/80' 형식으로 입력해주세요.");
              }
            } else {
              const edited = prompt(`${label} (${date}) 값 수정`, val);
              if (edited !== null && edited.trim() !== "") {
                updateLocalStorage(label, date, edited.trim());
              }
            }
          };
          td.appendChild(editBtn);

          // 삭제 버튼
          const deleteBtn = document.createElement("span");
          deleteBtn.textContent = " ❌";
          deleteBtn.style.cursor = "pointer";
          deleteBtn.onclick = () => {
            if (label === "혈압(최고/최저)") {
              removeFromLocalStorage("SBP", date);
              removeFromLocalStorage("DBP", date);
            } else {
              removeFromLocalStorage(label, date);
            }
          };
          td.appendChild(deleteBtn);
        }

        tr.appendChild(td);
      });

      const btnTd = document.createElement("td");
      const viewBtn = document.createElement("button");
      viewBtn.textContent = "보기";
      viewBtn.onclick = () => {
        if (label === "혈압(최고/최저)") {
          drawBloodPressureChart(); 
        } else {
          drawChartPopup(label, sortedDates, dataMap[label]);
        }
      }; 
      btnTd.appendChild(viewBtn);
      tr.appendChild(btnTd);

      tbody.appendChild(tr);
    });
  });
}

