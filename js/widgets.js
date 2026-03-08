/* ==========================================================================
   FILE: js/widgets.js
   CÔNG DỤNG: Xử lý Vòng tròn Tiến độ và Logic sinh lịch Mini Calendar
   ========================================================================== */
import { db } from './mockData.js';
import { setDateFilter } from './kanban.js'; // Gọi hàm lọc bên kanban.js

let currentDate = new Date(); // Biến lưu tháng/năm đang xem
let selectedDate = null;      // Biến lưu ngày người dùng click vào

export function initWidgets() {
    updateWidgets();    // Vẽ vòng tròn %
    renderCalendar();   // Vẽ lịch
    setupCalendarEvents(); // Bắt sự kiện click
    setupFocusTimer();
}

/**
 * 1. VÒNG TRÒN TIẾN ĐỘ THỐNG KÊ (Giữ nguyên như cũ)
 */
export function updateWidgets() {
    const total = db.tasks.length;
    const completed = db.tasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    const statDone = document.getElementById('stat-done');
    const statPending = document.getElementById('stat-pending');
    const progressPercent = document.getElementById('progress-percent');
    const circle = document.getElementById('svg-progress-bar');

    if(statDone) statDone.innerText = completed;
    if(statPending) statPending.innerText = pending;
    if(progressPercent) progressPercent.innerText = `${percent}%`;

    if(circle) circle.style.strokeDashoffset = 283 - (283 * percent / 100);
}

/**
 * 2. THUẬT TOÁN SINH LỊCH (MINI CALENDAR)
 */
function renderCalendar() {
    const grid = document.getElementById('mini-calendar');
    const monthYearText = document.getElementById('cal-month-year');
    if(!grid || !monthYearText) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // In Tiêu đề Tháng Năm
    const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
    monthYearText.innerText = `${monthNames[month]} ${year}`;

    // Khởi tạo dòng Tiêu đề Thứ
    let html = `
        <div class="cal-day-name">T2</div><div class="cal-day-name">T3</div><div class="cal-day-name">T4</div>
        <div class="cal-day-name">T5</div><div class="cal-day-name">T6</div><div class="cal-day-name">T7</div><div class="cal-day-name">CN</div>
    `;

    // Tính toán số ô trống đầu tháng
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 là Chủ nhật, 1 là T2...
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Ép Chủ nhật ra cuối (index 6)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // 1. Vẽ các ô trống (empty cells)
    for(let i=0; i<adjustedFirstDay; i++) {
        html += `<div class="cal-cell empty"></div>`;
    }

    // 2. Vẽ các ngày trong tháng
    for(let i=1; i<=daysInMonth; i++) {
        const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
        
        // Tạo chuỗi định dạng YYYY-MM-DD để dễ so sánh với Database
        const cellDateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const isSelected = selectedDate === cellDateStr;

        let classes = 'cal-cell';
        if(isToday) classes += ' today';       // Thêm class chấm tròn
        if(isSelected) classes += ' selected'; // Thêm class đổi màu xanh

        html += `<div class="${classes}" data-date="${cellDateStr}">${i}</div>`;
    }

    grid.innerHTML = html;
}

/**
 * 3. SỰ KIỆN CLICK LỊCH
 */
function setupCalendarEvents() {
    // Nút lùi tháng
    document.getElementById('cal-prev')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    // Nút tiến tháng
    document.getElementById('cal-next')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Bấm vào 1 ô ngày bất kỳ
    // Bấm vào 1 ô ngày bất kỳ trên lưới lịch
    document.getElementById('mini-calendar')?.addEventListener('click', (e) => {
        if(e.target.classList.contains('cal-cell') && !e.target.classList.contains('empty')) {
            const clickedDate = e.target.dataset.date;

            // LOGIC TOGGLE (BẬT / TẮT)
            // Nếu ngày click vào đúng bằng ngày đang được chọn -> Tắt bộ lọc (gắn null)
            if(selectedDate === clickedDate) {
                selectedDate = null;
                setDateFilter(null); // Gọi hàm bên kanban.js để tắt lọc
            } 
            // Nếu là ngày mới -> Bật bộ lọc theo ngày đó
            else {
                selectedDate = clickedDate;
                setDateFilter(clickedDate); // Gọi hàm bên kanban.js để lọc
            }
            
            // Vẽ lại lịch để cục màu xanh (highlight) nhảy đúng vị trí hoặc biến mất
            renderCalendar(); 
        }
    });

    // Bắt nút dấu [X] màu đỏ trên thanh Topbar để xóa bộ lọc lịch
    document.querySelector('.clear-date-btn')?.addEventListener('click', () => {
        selectedDate = null;
        setDateFilter(null);
        renderCalendar();
    });
}

/**
 * 4. HỆ THỐNG POMODORO & DÒNG CHẢY (DEEP WORK) CÓ TÍCH LŨY
 */
function setupFocusTimer() {
    if (!document.getElementById('focus-dashboard')) return;

    // Các thành phần UI
    const totalTimeEl = document.getElementById('total-focus-time');
    const timerDisplay = document.getElementById('timer-display');
    const statusEl = document.getElementById('timer-status');
    const btnStart = document.getElementById('btn-focus-start');
    const btnStop = document.getElementById('btn-focus-stop');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const btnSettings = document.getElementById('btn-focus-settings');
    const panelSettings = document.getElementById('focus-settings-panel');
    const btnSaveSettings = document.getElementById('btn-save-settings');

    // Biến trạng thái
    let timerInterval = null;
    let isRunning = false;
    let currentMode = 'pomodoro'; // 'pomodoro' hoặc 'deepwork'
    let isBreak = false;          // Đang trong giờ nghỉ Pomodoro?
    
    // Cài đặt thời gian (mặc định 25p - 5p)
    let workSecs = 25 * 60;
    let breakSecs = 5 * 60;
    
    // Biến đếm thời gian
    let currentTime = workSecs; // Thời gian hiển thị trên mặt đồng hồ
    let totalFocusSeconds = 0;  // Tổng số giây tập trung hôm nay

    // --- LOGIC 1: XỬ LÝ LƯU TRỮ VÀ RESET SAU 24 GIỜ ---
    function loadAndCheckDailyReset() {
        const today = new Date().toDateString(); // VD: "Sun Mar 08 2026"
        const savedData = JSON.parse(localStorage.getItem('taskmaster_focus_data') || '{}');
        
        if (savedData.date === today) {
            totalFocusSeconds = savedData.totalSeconds || 0;
        } else {
            totalFocusSeconds = 0; // Qua ngày mới -> Reset về 0
            saveData();
        }
        updateTotalUI();
    }

    function saveData() {
        localStorage.setItem('taskmaster_focus_data', JSON.stringify({
            date: new Date().toDateString(),
            totalSeconds: totalFocusSeconds
        }));
    }

    // --- LOGIC 2: CẬP NHẬT GIAO DIỆN ---
    function updateTotalUI() {
        const h = Math.floor(totalFocusSeconds / 3600);
        const m = Math.floor((totalFocusSeconds % 3600) / 60);
        totalTimeEl.innerText = h > 0 ? `${h}h ${m}p` : `${m} phút`;
    }

    function updateTimerUI() {
        const m = Math.floor(currentTime / 60);
        const s = currentTime % 60;
        timerDisplay.innerText = `${m < 10 ? '0':''}${m}:${s < 10 ? '0':''}${s}`;
    }

    // --- LOGIC 3: NHỊP TIM ĐỒNG HỒ (CHẠY MỖI GIÂY) ---
    function tick() {
        if (currentMode === 'pomodoro') {
            currentTime--; // Pomodoro đếm ngược
            
            // Nếu đang trong giờ học -> Cộng dồn vào Tổng
            if (!isBreak) {
                totalFocusSeconds++;
                if(totalFocusSeconds % 60 === 0) { saveData(); updateTotalUI(); } // Lưu mỗi phút cho nhẹ máy
            }

            if (currentTime <= 0) {
                isBreak = !isBreak; // Đổi trạng thái Học <-> Nghỉ
                currentTime = isBreak ? breakSecs : workSecs;
                timerDisplay.classList.toggle('break-mode', isBreak);
                statusEl.innerText = isBreak ? "Đang giải lao..." : "Đang tập trung...";
                alert(isBreak ? "Hết giờ học, nghỉ ngơi xíu đi!" : "Hết giờ nghỉ, quay lại cày tiếp thôi!");
            }
        } 
        else if (currentMode === 'deepwork') {
            currentTime++; // Deep work đếm xuôi (như bấm giờ)
            totalFocusSeconds++;
            if(totalFocusSeconds % 60 === 0) { saveData(); updateTotalUI(); }
        }
        updateTimerUI();
    }

    // --- SỰ KIỆN NÚT BẤM ---
    btnStart.addEventListener('click', () => {
        if (isRunning) return; // Đang chạy rồi thì thôi
        isRunning = true;
        btnStart.classList.add('hidden');
        btnStop.classList.remove('hidden');
        statusEl.innerText = (currentMode === 'pomodoro' && isBreak) ? "Đang giải lao..." : "Đang trong Flow...";
        
        timerInterval = setInterval(tick, 1000);
    });

    btnStop.addEventListener('click', () => {
        clearInterval(timerInterval);
        isRunning = false;
        btnStop.classList.add('hidden');
        btnStart.classList.remove('hidden');
        btnStart.innerHTML = '<i class="fa-solid fa-play"></i> Tiếp tục';
        statusEl.innerText = "Đang tạm dừng";
        saveData(); // Bấm dừng là phải lưu liền
        updateTotalUI();
    });

    // Chuyển chế độ (Pomodoro <-> Deep Work)
    modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (isRunning) { alert("Vui lòng dừng đồng hồ trước khi đổi chế độ!"); return; }
            
            modeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentMode = e.target.dataset.mode;

            if (currentMode === 'pomodoro') {
                isBreak = false;
                currentTime = workSecs;
                timerDisplay.classList.remove('break-mode');
                statusEl.innerText = "Sẵn sàng tập trung";
            } else {
                currentTime = 0; // Dòng chảy bắt đầu từ 00:00
                statusEl.innerText = "Bấm giờ Dòng chảy";
            }
            btnStart.innerHTML = '<i class="fa-solid fa-play"></i> Bắt đầu';
            updateTimerUI();
        });
    });

    // Cài đặt thời gian
    btnSettings.addEventListener('click', () => panelSettings.classList.toggle('hidden'));
    
    btnSaveSettings.addEventListener('click', () => {
        if (isRunning) { alert("Dừng đồng hồ trước khi đổi thời gian nhé!"); return; }
        
        workSecs = parseInt(document.getElementById('set-work-time').value) * 60;
        breakSecs = parseInt(document.getElementById('set-break-time').value) * 60;
        
        if (currentMode === 'pomodoro' && !isBreak) {
            currentTime = workSecs;
            updateTimerUI();
        }
        panelSettings.classList.add('hidden');
    });

    // Khởi động ban đầu
    loadAndCheckDailyReset();
    updateTimerUI();
}