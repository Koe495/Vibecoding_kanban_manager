/* ==========================================================================
   FILE: js/projects.js
   MỤC ĐÍCH: Quản lý Projects (snapshot của Tasks Inbox)
   - Lưu snapshot (boards + tasks) của Tasks Inbox vào Projects
   - Tạo Project (modal riêng), Chỉnh sửa Project (modal riêng)
   - Load / Delete Project, đổi màu hiển thị thẻ Project
   - Tách modal create / edit để tránh overlap
   ========================================================================== */

import { db } from './mockData.js';
import { renderKanban } from './kanban.js';
import { updateWidgets } from './widgets.js';
import { openModal, closeModal } from './app.js';

export let projects = [];
export const STORAGE_KEY = 'vibecoding_projects_v1';

// Trạng thái Project hiện tại (đang active trong Tasks Inbox)
export let currentProjectId = null;
export let currentProjectName = 'Untitled Project';

/* ===========================
   INIT
   =========================== */
export function initProjects() {
    loadProjects();
    renderProjectControls();
    renderProjectsList();
    attachProjectModalForms();

    // Nếu có projects đã lưu nhưng chưa có currentProjectId -> load project gần nhất
    if (!currentProjectId && projects.length > 0) {
        const last = projects[projects.length - 1];
        loadProject(last.id, false);
    } else {
        updateProjectTitleUI();
    }
}

/* ===========================
   Storage helpers
   =========================== */
function saveAllToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
        console.error('Failed to save projects to localStorage', e);
    }
}

function loadProjects() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        projects = raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Failed to load projects from localStorage', e);
        projects = [];
    }
}

/* ===========================
   Snapshot helpers
   =========================== */
function createSnapshot(name = null) {
    const boards = JSON.parse(JSON.stringify(db.boards || []));
    const tasks = JSON.parse(JSON.stringify(db.tasks || []));
    return {
        id: 'proj-' + Date.now(),
        name: name || currentProjectName || `Project ${new Date().toLocaleString()}`,
        createdAt: new Date().toISOString(),
        snapshot: { boards, tasks },
        colorClass: 'blue'
    };
}

/* ===========================
   Public operations
   =========================== */
export function saveCurrentProject(name = null) {
    const projectName = name || currentProjectName || `Project ${new Date().toLocaleString()}`;

    if (currentProjectId) {
        const existing = projects.find(p => p.id === currentProjectId);
        if (existing) {
            existing.name = projectName;
            existing.snapshot = {
                boards: JSON.parse(JSON.stringify(db.boards || [])),
                tasks: JSON.parse(JSON.stringify(db.tasks || []))
            };
            existing.updatedAt = new Date().toISOString();
        } else {
            // Fallback: create new project with snapshot
            const snap = createSnapshot(projectName);
            projects.push(snap);
            currentProjectId = snap.id;
        }
    } else {
        const snap = createSnapshot(projectName);
        projects.push(snap);
        currentProjectId = snap.id;
    }

    currentProjectName = projectName;
    saveAllToStorage();
    renderProjectsList();
    updateProjectTitleUI();
    if (typeof updateWidgets === 'function') updateWidgets();
    return currentProjectId;
}

export function createNewProjectAndSwitch(name = null, color = 'blue') {
    // Auto-save current project first
    saveCurrentProject();

    const newProj = {
        id: 'proj-' + Date.now(),
        name: name || `Untitled Project ${projects.length + 1}`,
        createdAt: new Date().toISOString(),
        snapshot: { boards: [], tasks: [] },
        colorClass: color
    };
    projects.push(newProj);
    saveAllToStorage();

    loadProject(newProj.id, false, true);
    renderProjectsList();
    return newProj.id;
}

export function loadProject(projectId, pushHistory = true, renderAfter = true) {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return false;

    // Restore snapshot into db
    db.boards = JSON.parse(JSON.stringify(proj.snapshot.boards || []));
    db.tasks = JSON.parse(JSON.stringify(proj.snapshot.tasks || []));

    currentProjectId = proj.id;
    currentProjectName = proj.name || 'Untitled Project';
    proj.lastOpenedAt = new Date().toISOString();

    saveAllToStorage();
    updateProjectTitleUI();
    if (renderAfter && typeof renderKanban === 'function') renderKanban();
    if (typeof updateWidgets === 'function') updateWidgets();
    return true;
}

export function deleteProject(projectId) {
    const idx = projects.findIndex(p => p.id === projectId);
    if (idx === -1) return false;
    projects.splice(idx, 1);
    saveAllToStorage();

    if (currentProjectId === projectId) {
        currentProjectId = null;
        currentProjectName = 'Untitled Project';
        db.boards = [];
        db.tasks = [];
        renderKanban();
        if (typeof updateWidgets === 'function') updateWidgets();
    }

    renderProjectsList();
    updateProjectTitleUI();
    return true;
}

export function renameProject(projectId, newName) {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return false;
    proj.name = newName;
    proj.updatedAt = new Date().toISOString();
    saveAllToStorage();
    if (projectId === currentProjectId) {
        currentProjectName = newName;
        updateProjectTitleUI();
    }
    renderProjectsList();
    return true;
}

/* ===========================
   UI: render Projects list
   =========================== */
export function renderProjectsList() {
    const container = document.getElementById('projects-board-container');
    if (!container) return;

    if (projects.length === 0) {
        container.innerHTML = `
            <div style="width:100%; text-align:center; padding:40px; color:var(--text-muted);">
                <i class="fa-solid fa-folder-open" style="font-size:40px; opacity:0.5; display:block; margin-bottom:12px;"></i>
                <p>Chưa có Project đã lưu. Dùng nút "Tạo Project Mới" ở góc trên để tạo.</p>
            </div>`;
        return;
    }

    let html = `<div style="display:flex; gap:12px; flex-wrap:wrap;">`;
    projects.forEach(p => {
        const isCurrent = p.id === currentProjectId ? 'current' : '';
        const colorClass = p.colorClass ? p.colorClass : 'blue';
        html += `
            <div class="project-card ${isCurrent} pj-col-${colorClass}" data-project-id="${p.id}">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="color-indicator" aria-hidden="true"></span>
                        <strong style="font-size:14px;">${p.name}</strong>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button class="action-btn btn-load-project" data-project-id="${p.id}" title="Mở"><i class="fa-solid fa-folder-open"></i></button>
                        <button class="action-btn btn-edit-project" data-project-id="${p.id}" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-btn btn-delete-project" data-project-id="${p.id}" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="project-meta">
                    Lưu: ${new Date(p.createdAt).toLocaleString()}${p.updatedAt ? '<br> Cập nhật: ' + new Date(p.updatedAt).toLocaleString() : ''}
                </div>
            </div>
        `;
    });
    html += `</div>`;

    container.innerHTML = html;
    attachProjectCardEvents();
}

/* ===========================
   UI: attach events to project cards
   =========================== */
function attachProjectCardEvents() {
    const container = document.getElementById('projects-board-container');
    if (!container) return;

    container.querySelectorAll('.btn-load-project').forEach(btn =>
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.projectId;
            if (!id) return;
            // Save current and switch
            saveCurrentProject();
            loadProject(id);
            // switch to Kanban view
            document.querySelectorAll('.sidebar .menu-item').forEach(m => m.classList.remove('active'));
            const inboxItem = document.querySelector('.sidebar .menu-item[data-target="view-kanban"]');
            if (inboxItem) inboxItem.classList.add('active');
            document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
            document.getElementById('view-kanban').classList.remove('hidden');
        })
    );

    container.querySelectorAll('.btn-delete-project').forEach(btn =>
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.projectId;
            if (!id) return;
            if (!confirm('Xóa Project này? Hành động không thể khôi phục.')) return;
            deleteProject(id);
        })
    );

    // edit: open edit modal (close create modal first to avoid overlap)
    container.querySelectorAll('.btn-edit-project').forEach(btn =>
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.projectId;
            const modalEdit = document.getElementById('modal-edit-project');
            const formEdit = document.getElementById('form-edit-project');
            if (!modalEdit || !formEdit) return;
            const proj = projects.find(p => p.id === id);
            if (!proj) return;
            // ensure create modal closed
            closeModal(document.getElementById('modal-create-project'));
            document.getElementById('edit-project-id').value = proj.id;
            document.getElementById('edit-project-title').value = proj.name || '';
            document.getElementById('edit-project-color').value = proj.colorClass || 'blue';
            openModal(modalEdit);
        })
    );
}

/* ===========================
   UI: Project controls (Kanban top area + Projects header)
   - btn-edit-project-name: open edit modal for current
   - btn-save-project: save current snapshot
   - btn-new-project: open create modal (user confirms)
   - projects header button (.projects-actions .btn-primary) open create modal
   =========================== */
function renderProjectControls() {
    updateProjectTitleUI();

    // Edit current project -> open edit modal (close create modal first)
    document.getElementById('btn-edit-project-name')?.addEventListener('click', () => {
        const modalEdit = document.getElementById('modal-edit-project');
        const formEdit = document.getElementById('form-edit-project');
        if (!modalEdit || !formEdit) return;
        closeModal(document.getElementById('modal-create-project'));
        if (currentProjectId) {
            const proj = projects.find(p => p.id === currentProjectId);
            if (proj) {
                document.getElementById('edit-project-id').value = proj.id;
                document.getElementById('edit-project-title').value = proj.name || currentProjectName || '';
                document.getElementById('edit-project-color').value = proj.colorClass || 'blue';
            } else {
                document.getElementById('edit-project-id').value = '';
                document.getElementById('edit-project-title').value = currentProjectName || '';
                document.getElementById('edit-project-color').value = 'blue';
            }
        } else {
            document.getElementById('edit-project-id').value = '';
            document.getElementById('edit-project-title').value = currentProjectName || '';
            document.getElementById('edit-project-color').value = 'blue';
        }
        openModal(modalEdit);
    });

    // Save current snapshot
    document.getElementById('btn-save-project')?.addEventListener('click', () => {
        const name = currentProjectName || prompt('Tên Project:', `Project ${new Date().toLocaleString()}`);
        saveCurrentProject(name);
        alert('Project đã được lưu.');
    });

    // New Project button -> open create modal (do not auto-create)
    document.getElementById('btn-new-project')?.addEventListener('click', () => {
        const modalCreate = document.getElementById('modal-create-project');
        const formCreate = document.getElementById('form-create-project');
        if (!modalCreate || !formCreate) return;
        closeModal(document.getElementById('modal-edit-project'));
        formCreate.reset();
        document.getElementById('create-project-color').value = 'blue';
        openModal(modalCreate);
    });

    // Projects view header button open create modal as well
    const headBtn = document.querySelector('.projects-actions .btn-primary');
    if (headBtn) {
        headBtn.addEventListener('click', () => {
            const modalCreate = document.getElementById('modal-create-project');
            const formCreate = document.getElementById('form-create-project');
            if (!modalCreate || !formCreate) return;
            closeModal(document.getElementById('modal-edit-project'));
            formCreate.reset();
            document.getElementById('create-project-color').value = 'blue';
            openModal(modalCreate);
        });
    }
}

/* ===========================
   Attach create/edit modal handlers (separate forms)
   - form-create-project: create new project (save current snapshot first)
   - form-edit-project: update project metadata (name + color)
   =========================== */
function attachProjectModalForms() {
    const formCreate = document.getElementById('form-create-project');
    const modalCreate = document.getElementById('modal-create-project');
    const formEdit = document.getElementById('form-edit-project');
    const modalEdit = document.getElementById('modal-edit-project');

    if (formCreate && modalCreate) {
        formCreate.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('create-project-title').value.trim();
            const color = document.getElementById('create-project-color').value || 'blue';
            if (!title) return alert('Vui lòng nhập tên Project');

            // Save current snapshot first, then create a new empty project and switch into it
            saveCurrentProject();
            const newProj = {
                id: 'proj-' + Date.now(),
                name: title,
                createdAt: new Date().toISOString(),
                snapshot: { boards: [], tasks: [] },
                colorClass: color
            };
            projects.push(newProj);
            saveAllToStorage();
            closeModal(modalCreate);

            loadProject(newProj.id, false, true);
            renderProjectsList();

            // switch view to Kanban
            document.querySelectorAll('.sidebar .menu-item').forEach(m => m.classList.remove('active'));
            const inboxItem = document.querySelector('.sidebar .menu-item[data-target="view-kanban"]');
            if (inboxItem) inboxItem.classList.add('active');
            document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
            document.getElementById('view-kanban').classList.remove('hidden');
        });
    }

    if (formEdit && modalEdit) {
        formEdit.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-project-id').value.trim();
            const title = document.getElementById('edit-project-title').value.trim();
            const color = document.getElementById('edit-project-color').value || 'blue';
            if (!title) return alert('Vui lòng nhập tên Project');

            const proj = projects.find(p => p.id === id);
            if (proj) {
                // Update metadata only (no snapshot changes)
                proj.name = title;
                proj.colorClass = color;
                proj.updatedAt = new Date().toISOString();
                saveAllToStorage();

                if (currentProjectId === proj.id) {
                    currentProjectName = proj.name;
                    updateProjectTitleUI();
                }

                renderProjectsList();
                closeModal(modalEdit);
            } else {
                // Fallback: if id not found, create new project (safe fallback)
                saveCurrentProject();
                const newProj = {
                    id: 'proj-' + Date.now(),
                    name: title,
                    createdAt: new Date().toISOString(),
                    snapshot: { boards: [], tasks: [] },
                    colorClass: color
                };
                projects.push(newProj);
                saveAllToStorage();
                closeModal(modalEdit);
                loadProject(newProj.id, false, true);
                renderProjectsList();
            }
        });
    }
}

/* ===========================
   UI helpers
   =========================== */
function updateProjectTitleUI() {
    const el = document.getElementById('project-title-display');
    if (el) el.innerText = currentProjectName || 'Untitled Project';
}