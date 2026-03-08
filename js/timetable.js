/* ==========================================================================
   FILE: js/timetable.js
   CÔNG DỤNG: Xử lý luồng Wizard 3 bước (Upload -> Cấu hình -> Xem Lưới)
   ========================================================================== */

import { db } from './mockData.js';
import { openModal, closeModal } from './app.js';

export function initTimetable() {
    setupWizardEvents();
    renderConfigSubjects(); // Dựng sẵn data bảng Step 2
}

/**
 * 1. ĐIỀU HƯỚNG CHUYỂN BƯỚC VÀ XỬ LÝ AI GIẢ LẬP
 */
function setupWizardEvents() {
    const step1 = document.getElementById('tt-step-1');
    const step2 = document.getElementById('tt-step-2');
    const step3 = document.getElementById('tt-step-3');
    const modalAi = document.getElementById('modal-ai-loading');

    const btnUploadTrigger = document.getElementById('btn-upload-trigger');
    const fileInput = document.getElementById('file-upload');
    const dropZone = document.getElementById('drop-zone'); // Lấy vùng Drop Zone

    // === HÀM XỬ LÝ CHUNG KHI NHẬN ĐƯỢC FILE ===
    function handleFiles(files) {
        if (files && files.length > 0) {
            const file = files[0];
            
            // Validate: Bắt buộc phải là file ảnh (Tránh user ném file word/pdf vào)
            if (!file.type.startsWith('image/')) {
                alert("Vui lòng chỉ tải lên định dạng ảnh (JPG, PNG)!");
                return;
            }

            console.log("Đã nhận file để AI phân tích:", file.name);

            openModal(modalAi);
            setTimeout(() => {
                closeModal(modalAi);
                step1.classList.add('hidden');
                step2.classList.remove('hidden');
                fileInput.value = ''; // Reset lại input
            }, 1500);
        }
    }

    // --- CÁCH 1: CLICK NÚT ĐỂ CHỌN FILE ---
    if (btnUploadTrigger && fileInput) {
        btnUploadTrigger.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    }

    // --- CÁCH 2: KÉO THẢ FILE HTML5 ---
    if (dropZone) {
        // 1. Chặn hành vi mở tab mới mặc định của trình duyệt
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        // 2. Thêm hiệu ứng CSS khi rê file vào
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
            }, false);
        });

        // 3. Xóa hiệu ứng CSS khi kéo file ra chỗ khác hoặc thả xuống
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            }, false);
        });

        // 4. Bắt lấy file khi người dùng nhả chuột (Drop)
        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files; // Lấy danh sách file vừa thả
            handleFiles(files);     // Quăng vào hàm xử lý chung ở trên
        });
    }
    // Nút [Quay lại] ở Bước 2
    document.getElementById('btn-back-step-1')?.addEventListener('click', () => {
        step2.classList.add('hidden');
        step1.classList.remove('hidden');
    });

    // Nút [Chốt thời khóa biểu] ở Bước 2 -> Sang Bước 3
    document.getElementById('btn-confirm-timetable')?.addEventListener('click', () => {
        step2.classList.add('hidden');
        step3.classList.remove('hidden');
        renderFinalGrid(); // Bắt đầu vẽ lưới
    });

    // Nút [Chỉnh sửa] ở Bước 3 -> Về Bước 2
    document.getElementById('btn-edit-timetable')?.addEventListener('click', () => {
        step3.classList.add('hidden');
        step2.classList.remove('hidden');
    });
}

/**
 * 2. BƯỚC 2: RENDER CÁC INPUT DỮ LIỆU ĐỂ CHỈNH SỬA
 */
function renderConfigSubjects() {
    const container = document.getElementById('subject-list-container');
    if (!container) return;

    let html = '';
    db.subjects.forEach(sub => {
        html += `
            <div class="subject-row" data-id="${sub.id}">
                <div><i class="fa-solid fa-pen" style="color:#9ca3af; margin-right:8px;"></i> <input type="text" value="${sub.title}"></div>
                <select>
                    <option value="Mon" ${sub.day === 'Mon' ? 'selected' : ''}>Thứ 2</option>
                    <option value="Tue" ${sub.day === 'Tue' ? 'selected' : ''}>Thứ 3</option>
                    <option value="Wed" ${sub.day === 'Wed' ? 'selected' : ''}>Thứ 4</option>
                    <option value="Thu" ${sub.day === 'Thu' ? 'selected' : ''}>Thứ 5</option>
                    <option value="Fri" ${sub.day === 'Fri' ? 'selected' : ''}>Thứ 6</option>
                    <option value="Sat" ${sub.day === 'Sat' ? 'selected' : ''}>Thứ 7</option>
                </select>
                <input type="time" value="${sub.startTime}">
                <input type="time" value="${sub.endTime}">
                <input type="text" value="${sub.room}">
                <button class="btn-delete-row"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    });
    container.innerHTML = html;
}

/**
 * 3. BƯỚC 3: RENDER BẢNG LƯỚI GRID VIEW FINAL
 * Phân loại môn học vào 3 Buổi dựa theo cấu trúc ảnh thiết kế
 */
function renderFinalGrid() {
    const gridBody = document.getElementById('advanced-grid-body');
    if (!gridBody) return;

    // Lọc môn học theo buổi (Giả lập logic phân buổi đơn giản qua giờ bắt đầu)
    // Sáng: < 12h | Chiều: >= 12h & < 18h | Tối: >= 18h
    const morningSubs = db.subjects.filter(s => parseInt(s.startTime.split(':')[0]) < 12);
    const afternoonSubs = db.subjects.filter(s => parseInt(s.startTime.split(':')[0]) >= 12 && parseInt(s.startTime.split(':')[0]) < 18);
    const eveningSubs = db.subjects.filter(s => parseInt(s.startTime.split(':')[0]) >= 18);

    gridBody.innerHTML = `
        ${createGridRow('SÁNG', '07:00', '11:30', morningSubs)}
        ${createGridRow('CHIỀU', '13:00', '17:30', afternoonSubs)}
        ${createGridRow('TỐI', '18:30', '21:00', eveningSubs)}
    `;
}

function createGridRow(buoiName, startTime, endTime, subjects) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Tạo 7 ô cho 7 ngày
    let daysHtml = '';
    days.forEach(day => {
        // Tìm xem buổi này, ngày này có môn nào không
        const sub = subjects.find(s => s.day === day);
        let cellContent = '';
        
        if (sub) {
            // Random class màu cho đẹp (color-1 -> color-4)
            const colorClass = `color-${(sub.id.charCodeAt(sub.id.length-1) % 4) + 1}`;
            cellContent = `
                <div class="tt-subject-card ${colorClass}">
                    <div class="tt-card-title">${sub.title}</div>
                    <div class="tt-card-info"><i class="fa-solid fa-location-dot"></i> ${sub.room}</div>
                    <div class="tt-card-info" style="margin-top:auto">${sub.startTime} - ${sub.endTime}</div>
                </div>
            `;
        }
        daysHtml += `<div class="tt-cell">${cellContent}</div>`;
    });

    return `
        <div class="tt-grid-row">
            <div class="tt-cell tt-cell-buoi">${buoiName}</div>
            <div class="tt-cell tt-cell-time">
                <span>${startTime}</span>
                <span>${endTime}</span>
            </div>
            ${daysHtml}
        </div>
    `;
}