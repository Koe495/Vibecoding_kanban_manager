/* ==========================================================================
   FILE: app.js
   CÔNG DỤNG: File gốc khởi chạy ứng dụng. Lắng nghe các sự kiện click chung 
              toàn cục như đổi Tab Menu, bật tắt Modal popup.
   ========================================================================== */
import { db } from './mockData.js';
import { initKanban } from './kanban.js';        // Thêm dòng này
import { initDragAndDrop } from './dragDrop.js';
import { initTimetable } from './timetable.js';
import { initWidgets } from './widgets.js';
import { initProjects } from './projects.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Hệ thống đã kết nối Mock Data:", db);
    
    initNavigation();
    initModals();
    
    initKanban(); 
    initDragAndDrop();
    initTimetable();
    initWidgets();
    initProjects();
});

/**
 * 1. XỬ LÝ ĐIỀU HƯỚNG SIDEBAR MENU (Chuyển View)
 */
function initNavigation() {
    const menuItems = document.querySelectorAll('.sidebar .menu-item[data-target]');
    const views = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Đổi hiệu ứng active cho Menu
            menuItems.forEach(m => m.classList.remove('active'));
            item.classList.add('active');

            // Đổi tiêu đề Topbar
            pageTitle.innerText = item.querySelector('span').innerText;

            // Ẩn tất cả các view, chỉ hiện view được chọn
            const targetId = item.getAttribute('data-target');
            views.forEach(view => {
                if (view.id === targetId) {
                    view.classList.remove('hidden');
                } else {
                    view.classList.add('hidden');
                }
            });
        });
    });
    
    // Xử lý nút Đăng xuất (Log Out)
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if(confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
                window.location.href = 'login.html';
            }
        });
    }
}

/**
 * 2. XỬ LÝ ĐÓNG / MỞ CÁC MODAL
 */
function initModals() {
    // Nút mở Modal
    const btnAddBoard = document.getElementById('btn-add-board');
    const btnSettings = document.getElementById('btn-open-settings');
    
    // Các Modal tương ứng
    const modalAddBoard = document.getElementById('modal-add-board');
    const modalSettings = document.getElementById('modal-settings');
    const modalAddTask = document.getElementById('modal-add-task');

    // Sự kiện mở Modal
    if(btnAddBoard) btnAddBoard.addEventListener('click', () => openModal(modalAddBoard));
    if(btnSettings) btnSettings.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(modalSettings);
    });

    // Sự kiện đóng Modal khi bấm nút X hoặc nút Hủy
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = e.target.closest('.modal-overlay');
            if (modal) closeModal(modal);
        });
    });

    // Sự kiện đóng Modal khi click ra ngoài vùng xám (overlay)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
            }
        });
    });
}

// Hàm tiện ích đóng/mở
export function openModal(modalElement) {
    if (modalElement) modalElement.classList.remove('hidden');
}

export function closeModal(modalElement) {
    if (modalElement) modalElement.classList.add('hidden');
}