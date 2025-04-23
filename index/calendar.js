  let calendar; 

  function getEvents() {

    const customData = JSON.parse(localStorage.getItem("customDataBatch") || "[]");

    const events = customData.map(entry => ({
      title:  (entry.hospital || "직접 입력") + " 검진",
      start: entry.date,
      color: "#3b82f6"
    }));
    console.log(localStorage.getItem("customDataBatch"));

    // XML 병원 데이터 (hospitalOnlyData)
    const xmlHospitals = JSON.parse(localStorage.getItem("hospitalOnlyData") || "{}");
    for (const [date, hospital] of Object.entries(xmlHospitals)) {
      events.push({
        title: `검진일 - ${hospital}`,
        date: date
      });
    }

    // 예정 검진일 (추가로 저장해둔 값)
    const scheduled = JSON.parse(localStorage.getItem("scheduledCheckups") || "[]");
    scheduled.forEach(event => {
      events.push({
        title:" 예정 : " + event.title || "예정 검진일" ,
        date: event.date,
        color: '#FFA500'
      });
    });

    return events;
  }

  function addScheduledEvent(date, title) {
    const scheduled = JSON.parse(localStorage.getItem("scheduledCheckups") || "[]");
    if (!scheduled.some(event => event.date === date)) {
      scheduled.push({ date, title });
      localStorage.setItem("scheduledCheckups", JSON.stringify(scheduled));
    }
  }

  function deleteRecord(date) {
    const scheduled = JSON.parse(localStorage.getItem("scheduledCheckups") || "[]");
    const updatedScheduled = scheduled.filter(event => event.date !== date);
    localStorage.setItem("scheduledCheckups", JSON.stringify(updatedScheduled));

    alert("일정이 삭제되었습니다.");
    calendar.removeAllEvents();        
    calendar.addEventSource(getEvents());
  }

  document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');

    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      locale: 'ko',
      height: 600,
      events: getEvents(),
      dateClick: function (info) {
        const clickedDate = info.dateStr;
        const eventTitle = prompt(`${clickedDate}에 대한 일정을 입력해주세요:`, '');

        if (eventTitle) {
          addScheduledEvent(clickedDate, eventTitle);
          calendar.removeAllEvents();        
          calendar.addEventSource(getEvents());
        }
      }
    });

    calendar.render();
  });

  //동기화
  window.addEventListener("storage", () => {
    calendar.removeAllEvents();
    calendar.addEventSource(getEvents());
  });
