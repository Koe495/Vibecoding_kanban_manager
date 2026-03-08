/* ==========================================================================
   FILE: js/projects.js
   CÔNG DỤNG: Xử lý logic màn hình Projects (Macro Kanban)
   ========================================================================== */
import { openModal, closeModal } from './app.js';

export let macroProjects = [];

export function initProjects() {
    setupProjectForms();
    renderProjectsBoard();
}

function setupProjectForms() {
    // === 1. FORM THÊM / SỬA CỘT DỰ ÁN ===
    const btnAddCol = document.querySelector('.projects-actions .btn-primary');
    const modalAddCol = document.getElementById('modal-add-project-col');
    const formAddCol = document.getElementById('form-add-project-col');

    // Sự kiện nút "Thêm Cột Mới" (Góc trên cùng)
    if (btnAddCol && modalAddCol) {
        btnAddCol.addEventListener('click', () => {
            // Xóa sạch ID cũ để báo hiệu đây là lệnh THÊM MỚI
            document.getElementById('edit-col-id').value = ''; 
            formAddCol.reset();
            openModal(modalAddCol);
        });
    }

    if (formAddCol) {
        formAddCol.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const editColId = document.getElementById('edit-col-id').value;
            const title = document.getElementById('project-col-title').value;
            const color = document.getElementById('project-col-color').value;

            if (editColId) {
                // CHẾ ĐỘ SỬA CỘT (UPDATE)
                const col = macroProjects.find(c => c.id === editColId);
                if (col) {
                    col.title = title;
                    col.colorClass = color;
                }
            } else {
                // CHẾ ĐỘ THÊM MỚI CỘT (CREATE)
                macroProjects.push({
                    id: 'pcol-' + Date.now(),
                    title: title,
                    colorClass: color,
                    cards: [] 
                });
            }

            renderProjectsBoard();
            closeModal(modalAddCol);
        });
    }

    // === 2. FORM THÊM / SỬA THẺ DỰ ÁN ===
    const modalAddCard = document.getElementById('modal-add-project-card');
    const formAddCard = document.getElementById('form-add-project-card');

    if (formAddCard) {
        formAddCard.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const colId = document.getElementById('card-col-id').value;
            const editId = document.getElementById('edit-card-id').value; 
            const name = document.getElementById('project-card-name').value;
            const total = parseInt(document.getElementById('project-card-total').value);
            const overrideColor = document.getElementById('project-card-color').value;

            const targetCol = macroProjects.find(col => col.id === colId);
            if (targetCol) {
                if (editId) {
                    const card = targetCol.cards.find(c => c.id === editId);
                    if (card) {
                        card.name = name;
                        card.total = total;
                        card.overrideColor = overrideColor !== "" ? overrideColor : null;
                        if (card.done > card.total) card.done = card.total; 
                    }
                } else {
                    targetCol.cards.push({
                        id: 'pcard-' + Date.now(),
                        name: name,
                        total: total,
                        done: 0, 
                        overrideColor: overrideColor !== "" ? overrideColor : null
                    });
                }
                renderProjectsBoard();
                closeModal(modalAddCard);
            }
        });
    }
}

export function renderProjectsBoard() {
    const container = document.getElementById('projects-board-container');
    if (!container) return;

    if (macroProjects.length === 0) {
        container.innerHTML = `
            <div style="width: 100%; text-align: center; padding: 40px; color: var(--text-muted); font-style: italic;">
                <i class="fa-solid fa-layer-group" style="font-size: 40px; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>Chưa có cột dự án nào. Hãy bấm "Thêm Cột Mới" góc trên bên phải để bắt đầu!</p>
            </div>`;
        return;
    }

    let html = '';
    macroProjects.forEach(col => {
        let cardsHtml = '';
        
        col.cards.forEach(card => {
            const cardColor = card.overrideColor || col.colorClass;
            const percent = card.total > 0 ? Math.round((card.done / card.total) * 100) : 0;
            
            let boxesHtml = '';
            for (let i = 0; i < card.total; i++) {
                if (i < card.done) {
                    boxesHtml += `<div class="pj-box done-${cardColor}" data-col-id="${col.id}" data-card-id="${card.id}" data-index="${i}" style="cursor: pointer;"></div>`;
                } else {
                    boxesHtml += `<div class="pj-box empty-${cardColor}" data-col-id="${col.id}" data-card-id="${card.id}" data-index="${i}" style="cursor: pointer;"></div>`;
                }
            }

            cardsHtml += `
                <div class="pj-card">
                    <div class="pj-card-header pj-col-${cardColor}" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>${card.name}</span>
                        <div class="pj-card-actions">
                            <i class="fa-solid fa-pen btn-edit-card" data-col-id="${col.id}" data-card-id="${card.id}" style="cursor: pointer; margin-right: 8px; font-size: 11px; opacity: 0.8;" title="Sửa thẻ"></i>
                            <i class="fa-solid fa-trash btn-delete-card" data-col-id="${col.id}" data-card-id="${card.id}" style="cursor: pointer; font-size: 11px; opacity: 0.8;" title="Xóa thẻ"></i>
                        </div>
                    </div>
                    <div class="pj-card-body">
                        <div class="pj-progress-boxes">${boxesHtml}</div>
                        <div class="pj-percent">${percent}%</div>
                    </div>
                </div>
            `;
        });

        // NÂNG CẤP GIAO DIỆN CỘT: Thêm Nút Sửa và Xóa vào Header Cột
        html += `
            <div class="pj-column">
                <div class="pj-col-header pj-col-${col.colorClass}" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${col.title}</span>
                    <div>
                        <i class="fa-solid fa-pen btn-edit-col" data-col-id="${col.id}" style="cursor: pointer; margin-right: 12px; font-size: 13px; opacity: 0.8;" title="Sửa tên/màu cột"></i>
                        <i class="fa-solid fa-trash btn-delete-col" data-col-id="${col.id}" style="cursor: pointer; font-size: 13px; opacity: 0.8;" title="Xóa toàn bộ cột"></i>
                    </div>
                </div>
                <div class="pj-card-list">${cardsHtml}</div>
                <div class="pj-col-footer btn-add-card" data-col-id="${col.id}">
                    <i class="fa-solid fa-plus"></i> Thêm thẻ
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // --- SỰ KIỆN NÚT "SỬA CỘT" ---
    container.querySelectorAll('.btn-edit-col').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const colId = e.currentTarget.dataset.colId;
            const col = macroProjects.find(c => c.id === colId);
            
            if (col) {
                // Đổ dữ liệu cũ lên Form
                document.getElementById('edit-col-id').value = col.id; // Gắn ID báo hiệu đang Sửa
                document.getElementById('project-col-title').value = col.title;
                document.getElementById('project-col-color').value = col.colorClass;
                
                openModal(document.getElementById('modal-add-project-col'));
            }
        });
    });

    // --- SỰ KIỆN NÚT "XÓA CỘT" ---
    container.querySelectorAll('.btn-delete-col').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (confirm("CẢNH BÁO: Xóa cột này sẽ làm bốc hơi toàn bộ Thẻ dự án bên trong. Bạn chắc chắn chứ?")) {
                const colId = e.currentTarget.dataset.colId;
                // Dùng hàm splice để cắt bỏ cột đó ra khỏi mảng
                const index = macroProjects.findIndex(c => c.id === colId);
                if (index !== -1) {
                    macroProjects.splice(index, 1);
                    renderProjectsBoard();
                }
            }
        });
    });

    // --- SỰ KIỆN NÚT "THÊM THẺ MỚI" ---
    container.querySelectorAll('.btn-add-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const colId = e.currentTarget.dataset.colId;
            document.getElementById('card-col-id').value = colId;
            document.getElementById('edit-card-id').value = ''; 
            
            const form = document.getElementById('form-add-project-card');
            if (form) form.reset();
            
            openModal(document.getElementById('modal-add-project-card'));
        });
    });

    // --- SỰ KIỆN NÚT "SỬA THẺ" ---
    container.querySelectorAll('.btn-edit-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const colId = e.currentTarget.dataset.colId;
            const cardId = e.currentTarget.dataset.cardId;
            
            const col = macroProjects.find(c => c.id === colId);
            if(col) {
                const card = col.cards.find(c => c.id === cardId);
                if(card) {
                    document.getElementById('card-col-id').value = colId;
                    document.getElementById('edit-card-id').value = card.id; 
                    document.getElementById('project-card-name').value = card.name;
                    document.getElementById('project-card-total').value = card.total;
                    document.getElementById('project-card-color').value = card.overrideColor || "";
                    
                    openModal(document.getElementById('modal-add-project-card'));
                }
            }
        });
    });

    // --- SỰ KIỆN NÚT "XÓA THẺ" ---
    container.querySelectorAll('.btn-delete-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(confirm("Bạn có chắc chắn muốn xóa thẻ dự án này không?")) {
                const colId = e.currentTarget.dataset.colId;
                const cardId = e.currentTarget.dataset.cardId;
                
                const col = macroProjects.find(c => c.id === colId);
                if(col) {
                    col.cards = col.cards.filter(c => c.id !== cardId);
                    renderProjectsBoard(); 
                }
            }
        });
    });

    // --- SỰ KIỆN CLICK TÍCH VÀO Ô VUÔNG ---
    container.querySelectorAll('.pj-box').forEach(box => {
        box.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const colId = e.target.dataset.colId;
            const cardId = e.target.dataset.cardId;
            const index = parseInt(e.target.dataset.index);

            const col = macroProjects.find(c => c.id === colId);
            if (col) {
                const card = col.cards.find(c => c.id === cardId);
                if (card) {
                    if (card.done === index + 1) {
                        card.done = index; 
                    } else {
                        card.done = index + 1; 
                    }
                    renderProjectsBoard();
                }
            }
        });
    });
}