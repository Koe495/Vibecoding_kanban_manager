import { db } from './mockData.js';
import { renderKanban } from './kanban.js';

export function initDragAndDrop() {
    const kanbanView = document.getElementById('view-kanban');
    if (!kanbanView) return;

    let draggedItem = null;
    let dragType = null; // 'board' hoặc 'task'

    kanbanView.addEventListener('dragstart', (e) => {
        // Kiểm tra xem đang kéo Board hay kéo Task
        if (e.target.classList.contains('board-column')) {
            draggedItem = e.target;
            dragType = 'board';
            setTimeout(() => e.target.style.opacity = '0.4', 0);
        } else if (e.target.classList.contains('task-card') && db.settings.enableTaskDragDrop) {
            draggedItem = e.target;
            dragType = 'task';
            setTimeout(() => e.target.style.opacity = '0.4', 0);
        }
    });

    kanbanView.addEventListener('dragend', (e) => {
        if (draggedItem) draggedItem.style.opacity = '1';
        draggedItem = null;
        dragType = null;
        document.querySelectorAll('.board-column, .active-area').forEach(el => {
            el.style.border = '';
            el.classList.remove('drag-over');
        });
    });

    kanbanView.addEventListener('dragover', (e) => {
        e.preventDefault();
        
        // 1. Logic Highlight viền (Giữ nguyên)
        if (dragType === 'board') {
            const activeArea = e.target.closest('.active-area');
            if (activeArea) activeArea.style.border = '2px dashed var(--primary-color)';
        } else if (dragType === 'task') {
            const list = e.target.closest('.board-task-list');
            if (list) list.classList.add('drag-over');
        }

        // 2. THUẬT TOÁN AUTO-SCROLL THẦN THÁNH
        // Định nghĩa vùng nhạy cảm (cách mép 80px) và tốc độ cuộn
        const scrollThreshold = 80; 
        const scrollSpeed = 15; 
        
        // Lấy tọa độ của nguyên cái khung Kanban
        const rect = kanbanView.getBoundingClientRect();
        
        // Nếu chuột chạm vào vùng nhạy cảm ở CẠNH TRÊN màn hình -> Cuộn lên
        if (e.clientY - rect.top < scrollThreshold) {
            kanbanView.scrollTop -= scrollSpeed;
        } 
        // Nếu chuột chạm vào vùng nhạy cảm ở CẠNH DƯỚI màn hình -> Cuộn xuống
        else if (rect.bottom - e.clientY < scrollThreshold) {
            kanbanView.scrollTop += scrollSpeed;
        }
    });

    kanbanView.addEventListener('dragleave', (e) => {
        if (dragType === 'board') {
            const activeArea = e.target.closest('.active-area');
            if (activeArea) activeArea.style.border = '';
        } else if (dragType === 'task') {
            const list = e.target.closest('.board-task-list');
            if (list) list.classList.remove('drag-over');
        }
    });

    kanbanView.addEventListener('drop', (e) => {
        e.preventDefault();
        
        if (dragType === 'board' && draggedItem) {
            const boardId = draggedItem.dataset.boardId;
            const targetArea = e.target.closest('.active-area');
            const targetBoard = e.target.closest('.board-column');
            
            // Lấy ra vị trí xuất phát của cái bảng đang kéo
            const isFromCompleted = draggedItem.closest('#completed-boards-container') !== null;
            
            // TRƯỜNG HỢP 1: Kéo bảng từ dưới Đã Xong lên trên Active -> Reset toàn bộ Task
            if (targetArea && isFromCompleted) {
                db.tasks.forEach(t => {
                    if (t.boardId === boardId) t.status = 'pending';
                });
                renderKanban();
            } 
            // TRƯỜNG HỢP 2: Hoán đổi vị trí 2 bảng với nhau trong cùng một khu vực (Không Reset)
            else if (targetBoard && targetBoard.dataset.boardId !== boardId) {
                const targetBoardId = targetBoard.dataset.boardId;
                const boardA = db.boards.find(b => b.id === boardId);
                const boardB = db.boards.find(b => b.id === targetBoardId);
                
                // Swap order (Thứ tự)
                const tempOrder = boardA.order;
                boardA.order = boardB.order;
                boardB.order = tempOrder;
                
                renderKanban();
            }
        }
        else if (dragType === 'task' && draggedItem) {
            const taskList = e.target.closest('.board-task-list');
            if (taskList) {
                const taskId = draggedItem.dataset.taskId;
                const newBoardId = taskList.dataset.boardId;
                
                const task = db.tasks.find(t => t.id === taskId);
                if (task) task.boardId = newBoardId;
                renderKanban();
            }
        }
    });
}