/* ==========================================================================
   FILE: public/js/app.js
   CÔNG DỤNG: Khởi chạy ứng dụng, chờ tải dữ liệu từ MongoDB xong mới hiển thị
   ========================================================================== */
import { db, authAPI, initMongoDBData } from './mockData.js';
import { initKanban } from './kanban.js';        
import { initDragAndDrop } from './dragDrop.js';
import { initTimetable } from './timetable.js';
import { initWidgets } from './widgets.js';
import { initProjects } from './projects.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    const currentUser = authAPI.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return; 
    }

    // HIỂN THỊ TÊN & AVATAR LÊN SIDEBAR
    const userNameDisplay = document.getElementById('user-display-name');
    const userEmailDisplay = document.getElementById('user-display-email');
    const userAvatarDisplay = document.getElementById('user-display-avatar');
    
    if (userNameDisplay) userNameDisplay.innerText = currentUser.name;
    if (userEmailDisplay) userEmailDisplay.innerText = currentUser.email;
    if (userAvatarDisplay) userAvatarDisplay.innerText = currentUser.name.charAt(0).toUpperCase();

    // TẠO MÀN HÌNH LOADING CHỜ MONGODB
    const loadingDiv = document.createElement('div');
    loadingDiv.innerHTML = `
        <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:var(--bg-main, #f5f6f8); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center;">
            <i class="fa-solid fa-database fa-bounce" style="font-size: 40px; color: #10b981; margin-bottom: 20px;"></i>
            <h2 style="font-family: 'Inter', sans-serif; color: #334155;">Đang đồng bộ dữ liệu...</h2>
        </div>
    `;
    document.body.appendChild(loadingDiv);

    // CHỜ TẢI DỮ LIỆU TỪ BACKEND
    await initMongoDBData();
    console.log("✅ Hệ thống MongoDB Sẵn sàng!");

    // KHỞI TẠO CÁC MODULE UI (chỉ chạy sau khi data đã có)
    loadingDiv.remove(); // Xóa màn hình loading
    
    initNavigation();
    initModals();
    
    initKanban(); 
    initDragAndDrop();
    initTimetable();
    initWidgets();
    initProjects();

    // SỰ KIỆN ĐĂNG XUẤT
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            authAPI.logout(); 
        });
    }
});

// (Các hàm initNavigation, initModals, openModal, closeModal bên dưới giữ nguyên y hệt file cũ của bạn)
function initNavigation() {
    const menuItems = document.querySelectorAll('.sidebar .menu-item[data-target]');
    const views = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            menuItems.forEach(m => m.classList.remove('active'));
            item.classList.add('active');

            if (pageTitle) pageTitle.innerText = item.querySelector('span').innerText;

            const targetId = item.getAttribute('data-target');
            views.forEach(view => {
                if (view.id === targetId) view.classList.remove('hidden');
                else view.classList.add('hidden');
            });
        });
    });
}

function initModals() {
    const btnAddBoard = document.getElementById('btn-add-board');
    const btnSettings = document.getElementById('btn-open-settings');
    const modalAddBoard = document.getElementById('modal-add-board');
    const modalSettings = document.getElementById('modal-settings');

    if(btnAddBoard) btnAddBoard.addEventListener('click', () => openModal(modalAddBoard));
    if(btnSettings) btnSettings.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(modalSettings);
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = e.target.closest('.modal-overlay');
            if (modal) closeModal(modal);
        });
    });
}

export function openModal(modalElement) {
    if (modalElement) modalElement.classList.remove('hidden');
}

export function closeModal(modalElement) {
    if (modalElement) modalElement.classList.add('hidden');
}