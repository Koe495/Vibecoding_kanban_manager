/* ==========================================================================
   FILE: js/kanban.js
   CÔNG DỤNG: Xử lý toàn bộ logic vẽ bảng, lọc Task, Màu sắc và Form
   ========================================================================== */
import { db } from './mockData.js';
import { openModal, closeModal } from './app.js';
import { updateWidgets } from './widgets.js';

// 2 BIẾN NÀY BẮT BUỘC PHẢI NẰM Ở NGOÀI CÙNG ĐỂ LƯU TRỮ TOÀN CỤC
export let currentFilter = 'all';
export let currentDateFilter = null; 

export function initKanban() {
    setupFilters();
    setupForms();
    setupSettingsToggle();
    renderKanban();
}

export function renderKanban() {
    const activeContainer = document.getElementById('active-boards-container');
    const completedContainer = document.getElementById('completed-boards-container');
    if (!activeContainer || !completedContainer) return;

    activeContainer.innerHTML = '';
    completedContainer.innerHTML = '';

    const activeBoards = [];
    const completedBoards = [];

    // Sắp xếp bảng theo order
    db.boards.sort((a, b) => a.order - b.order).forEach(board => {
        let boardTasks = db.tasks.filter(t => t.boardId === board.id);

        // --- TẦNG LỌC 1: ĐỘ ƯU TIÊN ---
        if (currentFilter !== 'all') boardTasks = boardTasks.filter(t => t.priority === currentFilter);
        if (db.settings.hideCompletedTasks) boardTasks = boardTasks.filter(t => t.status !== 'completed');

        // --- TẦNG LỌC 2: ẨN TASK ĐÃ XONG ---
        if (currentDateFilter) {
            boardTasks = boardTasks.filter(t => {
                if (!t.startDate && !t.endDate) return false; 
                const start = t.startDate || t.endDate; 
                const end = t.endDate || t.startDate;
                return currentDateFilter >= start && currentDateFilter <= end;
            });
        }

        // --- TẦNG LỌC 3: LỊCH (FIX LỖI TRƠ TRƠ) ---
        if (currentDateFilter && boardTasks.length === 0) {
            return; // Lệnh return trong forEach có tác dụng như continue (nhảy sang bảng tiếp theo)
        }

        // --- LOGIC SẮP XẾP TASK ---
        if (!db.settings.enableTaskDragDrop) {
            const priorityWeight = { 'high': 3, 'medium': 2, 'low': 1 };
            boardTasks.sort((a, b) => {
                if (a.status !== b.status) return a.status === 'completed' ? 1 : -1;
                return priorityWeight[b.priority] - priorityWeight[a.priority];
            });
        }

        const isBoardCompleted = boardTasks.length > 0 && boardTasks.every(t => t.status === 'completed');
        const boardHTML = createBoardHTML(board, boardTasks);

        if (isBoardCompleted) completedBoards.push(boardHTML);
        else activeBoards.push(boardHTML);
    });

    activeContainer.innerHTML = activeBoards.join('');
    
    const completedArea = document.getElementById('completed-area-wrapper');
    if (db.settings.hideCompletedBoards || completedBoards.length === 0) {
        completedArea.classList.add('hidden');
    } else {
        completedArea.classList.remove('hidden');
        completedContainer.innerHTML = completedBoards.join('');
    }

    attachBoardEvents();
    if (typeof updateWidgets === 'function') updateWidgets(); 
}

// FIX LỖI 2: ĐỔI MÀU CẢ BẢNG THAY VÌ MÀU CHỮ
function createBoardHTML(board, tasks) {
    const tasksHTML = tasks.map(t => createTaskHTML(t)).join('');
    // Gắn style background-color trực tiếp vào .board-column
    return `
        <div class="board-column" data-board-id="${board.id}" draggable="true" style="background-color: var(--${board.color});">
            <div class="board-header">
                <span class="board-title" style="color: var(--text-main);">${board.title}</span>
                <div class="board-actions">
                    <span style="font-size: 12px; font-weight: 600; margin-right: 8px;">${tasks.length}</span>
                    <div class="action-menu">
                        <i class="fa-solid fa-ellipsis-vertical action-menu-icon"></i>
                        <div class="menu-content">
                            <button class="action-btn btn-edit btn-edit-board" data-id="${board.id}"><i class="fa-solid fa-pen"></i></button>
                            <button class="action-btn btn-delete btn-delete-board" data-id="${board.id}"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="board-task-list" data-board-id="${board.id}">${tasksHTML}</div>
            <div class="board-footer">
                <button class="btn-add-task-board" data-board-id="${board.id}">
                    <i class="fa-solid fa-plus"></i> Thêm công việc
                </button>
            </div>
        </div>
    `;
}

function createTaskHTML(task) {
    const isCompleted = task.status === 'completed';
    const checkedHtml = isCompleted ? 'checked' : '';
    const classCompleted = isCompleted ? 'completed' : '';
    const isDraggable = db.settings.enableTaskDragDrop ? 'draggable="true"' : '';

    // === TÍNH NĂNG MỚI: XỬ LÝ HIỂN THỊ THỜI GIAN ĐẸP MẮT ===
    let timeHtml = '';
    if (task.startDate || task.endDate) {
        // Hàm phụ tút lại ngày: 2026-03-09 -> 09/03
        const formatDate = (dateStr) => {
            if (!dateStr) return '...';
            const parts = dateStr.split('-');
            return `${parts[2]}/${parts[1]}`;
        };

        const startStr = formatDate(task.startDate);
        const endStr = formatDate(task.endDate);
        
        // Nếu ngày bắt đầu và kết thúc giống nhau thì chỉ in 1 cái. Khác nhau thì in [Bắt đầu - Kết thúc]
        const displayTime = (task.startDate === task.endDate) ? startStr : `${startStr} - ${endStr}`;
        
        timeHtml = `
            <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px; font-weight: 500; display: flex; align-items: center; gap: 4px;">
                <i class="fa-regular fa-clock"></i> ${displayTime}
            </div>
        `;
    }

    return `
        <div class="task-card ${classCompleted}" data-task-id="${task.id}" ${isDraggable}>
            <div class="task-checkbox-wrap">
                <input type="checkbox" class="toggle-task-status" data-task-id="${task.id}" ${checkedHtml}>
            </div>
            <div class="task-content">
                <div style="display: flex; justify-content: space-between;">
                    <h4 class="task-title">${task.title}</h4>
                    <div class="action-menu">
                        <i class="fa-solid fa-ellipsis-vertical action-menu-icon" style="font-size: 12px;"></i>
                        <div class="menu-content" style="top: 14px;">
                            <button class="action-btn btn-edit btn-edit-task" data-id="${task.id}"><i class="fa-solid fa-pen"></i></button>
                            <button class="action-btn btn-delete btn-delete-task" data-id="${task.id}"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                </div>
                ${task.description ? `<p class="task-desc">${task.description}</p>` : ''}
                
                ${timeHtml} <div class="task-tags">
                    <span class="tag tag-${task.priority === 'medium' ? 'med' : task.priority}">${task.priority}</span>
                </div>
            </div>
        </div>
    `;
}

function attachBoardEvents() {
    const kanbanView = document.getElementById('view-kanban');

    kanbanView.querySelectorAll('.toggle-task-status').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const task = db.tasks.find(t => t.id === e.target.dataset.taskId);
            if (task) { task.status = e.target.checked ? 'completed' : 'pending'; renderKanban(); }
        });
    });

    kanbanView.querySelectorAll('.btn-delete-board').forEach(btn => btn.addEventListener('click', (e) => {
        if(confirm("Xóa bảng này và toàn bộ công việc bên trong?")) {
            const id = e.currentTarget.dataset.id;
            db.boards = db.boards.filter(b => b.id !== id);
            db.tasks = db.tasks.filter(t => t.boardId !== id);
            renderKanban();
        }
    }));

    kanbanView.querySelectorAll('.btn-delete-task').forEach(btn => btn.addEventListener('click', (e) => {
        if(confirm("Xóa công việc này?")) {
            db.tasks = db.tasks.filter(t => t.id !== e.currentTarget.dataset.id);
            renderKanban();
        }
    }));

    kanbanView.querySelectorAll('.btn-edit-board').forEach(btn => btn.addEventListener('click', (e) => {
        const board = db.boards.find(b => b.id === e.currentTarget.dataset.id);
        if(board) {
            document.getElementById('edit-board-id').value = board.id;
            document.getElementById('board-title').value = board.title;
            openModal(document.getElementById('modal-add-board'));
        }
    }));

    kanbanView.querySelectorAll('.btn-edit-task').forEach(btn => btn.addEventListener('click', (e) => {
        const task = db.tasks.find(t => t.id === e.currentTarget.dataset.id);
        if(task) {
            document.getElementById('edit-task-id').value = task.id;
            document.getElementById('task-board-id').value = task.boardId;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-desc').value = task.description;
            document.getElementById('task-priority').value = task.priority;
            // Đổ lại dữ liệu ngày tháng lên form
            document.getElementById('task-start-date').value = task.startDate || '';
            document.getElementById('task-end-date').value = task.endDate || '';
            openModal(document.getElementById('modal-add-task'));
        }
    }));

    kanbanView.querySelectorAll('.btn-add-task-board').forEach(btn => btn.addEventListener('click', (e) => {
        document.getElementById('task-board-id').value = e.currentTarget.dataset.boardId;
        document.getElementById('edit-task-id').value = ''; 
        document.getElementById('form-add-task').reset();
        openModal(document.getElementById('modal-add-task'));
    }));
}

function setupForms() {
    // 1. CỤC CHỌN MÀU
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
        });
    });

    // 2. FORM BOARD
    document.getElementById('form-add-board')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-board-id').value;
        const title = document.getElementById('board-title').value;
        const color = `pastel-${document.querySelector('.color-option.selected')?.dataset.color || 'blue'}`;

        if(editId) {
            const board = db.boards.find(b => b.id === editId);
            board.title = title; board.color = color;
        } else {
            db.boards.push({ id: 'b' + Date.now(), title, color, order: db.boards.length + 1 });
        }
        renderKanban();
        closeModal(document.getElementById('modal-add-board'));
        e.target.reset(); document.getElementById('edit-board-id').value = '';
    });

    // 3. FORM TASK
    document.getElementById('form-add-task')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-task-id').value;
        const title = document.getElementById('task-title').value;
        const desc = document.getElementById('task-desc').value;
        const priority = document.getElementById('task-priority').value;
        const startDate = document.getElementById('task-start-date').value;
        const endDate = document.getElementById('task-end-date').value;
        
        if(editId) {
            const task = db.tasks.find(t => t.id === editId);
            if (task) {
                task.title = title; task.description = desc; task.priority = priority;
                task.startDate = startDate; task.endDate = endDate;
            }
        } else {
            db.tasks.push({
                id: 't' + Date.now(),
                boardId: document.getElementById('task-board-id').value,
                title: title, description: desc, priority: priority,
                startDate: startDate, endDate: endDate, status: 'pending'
            });
        }
        renderKanban();
        closeModal(document.getElementById('modal-add-task'));
        e.target.reset(); document.getElementById('edit-task-id').value = '';
    });
}

function setupFilters() {
    const filterBtns = document.querySelectorAll('#kanban-filters .filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentFilter = e.currentTarget.dataset.filter;
            renderKanban();
        });
    });
}

function setupSettingsToggle() {
    const toggle = document.getElementById('toggle-task-drag');
    if(toggle) {
        toggle.checked = db.settings.enableTaskDragDrop;
        toggle.addEventListener('change', (e) => {
            db.settings.enableTaskDragDrop = e.target.checked;
            renderKanban();
        });
    }
}

// HÀM NHẬN LỆNH TỪ LỊCH ĐỂ LỌC VÀ HIỆN CHỮ LÊN TOPBAR
export function setDateFilter(dateStr) {
    currentDateFilter = dateStr;
    const badge = document.getElementById('selected-date-badge');
    const text = document.getElementById('selected-date-text');

    if(dateStr && badge && text) {
        badge.classList.remove('hidden');
        // Format từ "YYYY-MM-DD" sang "DD/MM" cho gọn đẹp
        const parts = dateStr.split('-');
        text.innerText = parts[2] + '/' + parts[1];
    } else if (badge) {
        badge.classList.add('hidden');
    }
    renderKanban(); 
}