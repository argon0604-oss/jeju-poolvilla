/* ================================================================
   돌담채 script.js
   JavaScript = 페이지를 '살아있게' 만드는 부분.
   핵심 흐름:  ① 화면 요소를 찾고  ② 사건(클릭·입력)을 듣고  ③ 화면을 바꾼다
   ================================================================ */

/* ================================================================
   기능 1) 객실 필터 — 버튼 누르면 해당 분류 카드만 보이기
   ================================================================ */

// (1) 화면에서 요소 찾기
//   querySelectorAll = 조건에 맞는 요소를 '전부' 찾아 목록으로 준다
const filterButtons = document.querySelectorAll(".filter-btn"); // 필터 버튼들
const rooms = document.querySelectorAll(".room");               // 객실 카드들

// (2) 버튼마다 '클릭 사건'을 듣게 한다
filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    // 이 버튼에 숨겨둔 data-filter 값 읽기 (all / pool / standard)
    const filter = button.getAttribute("data-filter");

    // 모든 버튼에서 활성 표시 떼고, 방금 누른 버튼에만 붙이기
    filterButtons.forEach((b) => b.classList.remove("is-active"));
    button.classList.add("is-active");

    // (3) 카드 하나씩 보면서 보일지 숨길지 결정
    rooms.forEach(function (room) {
      const category = room.getAttribute("data-category");
      // '전체'이거나, 카드 분류가 선택한 필터와 같으면 보이기 / 아니면 숨기기
      if (filter === "all" || category === filter) {
        room.style.display = "flex";
      } else {
        room.style.display = "none";
      }
    });
  });
});

/* ================================================================
   기능 2) 예약 폼 — 입력할 때마다 요금 실시간 계산
   ================================================================ */

// (1) 필요한 요소들 찾기
const roomSelect = document.getElementById("room");     // 객실 선택
const checkin = document.getElementById("checkin");     // 체크인 날짜
const checkout = document.getElementById("checkout");   // 체크아웃 날짜
const guests = document.getElementById("guests");       // 인원
const form = document.getElementById("bookingForm");    // 폼 전체

// 요약 패널에 결과를 써 넣을 자리들
const sumRoom = document.getElementById("sumRoom");
const sumNights = document.getElementById("sumNights");
const sumGuests = document.getElementById("sumGuests");
const sumTotal = document.getElementById("sumTotal");
const bookingMsg = document.getElementById("bookingMsg");

// 숫자에 콤마 넣어주는 도우미 (450000 → "450,000")
function withComma(number) {
  return number.toLocaleString("ko-KR");
}

// (2) 요약을 다시 계산해서 화면에 반영하는 함수
function updateSummary() {
  // 선택된 객실: 요금(value)과 이름(보이는 글자) 둘 다 읽기
  const price = Number(roomSelect.value);
  const roomName = roomSelect.options[roomSelect.selectedIndex].text.split(" (")[0];

  // 박수 계산: (체크아웃 - 체크인)을 '일(day)' 단위로
  let nights = 0;
  if (checkin.value && checkout.value) {
    const inDate = new Date(checkin.value);
    const outDate = new Date(checkout.value);
    const diffMs = outDate - inDate;                 // 밀리초 차이
    nights = Math.round(diffMs / (1000 * 60 * 60 * 24)); // 하루 = 86,400,000ms
    if (nights < 0) nights = 0;                       // 날짜 거꾸로면 0
  }

  const total = price * nights;

  // (3) 계산 결과를 요약 패널에 써 넣기
  sumRoom.textContent = roomName;
  sumNights.textContent = nights;
  sumGuests.textContent = guests.value;
  sumTotal.textContent = withComma(total) + "원";
}

// (4) 어느 입력이든 값이 바뀌면 updateSummary 실행
[roomSelect, checkin, checkout, guests].forEach(function (el) {
  el.addEventListener("input", updateSummary);
  el.addEventListener("change", updateSummary);
});

// (5) 제출(예약 요청) 시: 새로고침 막고 확인 메시지 표시
form.addEventListener("submit", function (event) {
  event.preventDefault(); // 폼 기본동작(페이지 새로고침) 막기

  const name = document.getElementById("name").value.trim();
  const nights = Number(sumNights.textContent);

  if (!name) {
    bookingMsg.textContent = "성함을 입력해 주세요.";
    return;
  }
  if (nights <= 0) {
    bookingMsg.textContent = "체크인·체크아웃 날짜를 확인해 주세요.";
    return;
  }

  bookingMsg.textContent =
    name + "님, " + sumRoom.textContent + " " + nights + "박 예약 요청이 접수되었습니다. 확인 후 연락드리겠습니다.";
});

// 페이지가 처음 열릴 때도 한 번 계산해 초기값 채우기
updateSummary();

/* ================================================================
   기능 3) 스크롤 등장 애니메이션
   IntersectionObserver = "이 요소가 화면에 들어왔나?"를 감시해주는 도구
   ================================================================ */

// 소개~푸터 섹션들에 fade-in 클래스를 붙인다 (Hero는 제외 — 첫 화면은 바로 보이게)
const fadeTargets = document.querySelectorAll(
  "#intro, #rooms, #gallery, #booking, .footer"
);
fadeTargets.forEach((el) => el.classList.add("fade-in"));

// 감시자 만들기: 요소가 화면에 10% 이상 보이면 is-visible 붙이기
const observer = new IntersectionObserver(
  function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target); // 한 번 뜬 뒤엔 감시 해제
      }
    });
  },
  { threshold: 0.1 }
);

// 각 대상을 감시 시작
fadeTargets.forEach((el) => observer.observe(el));
