/* ==========================================================================
   FILE: js/projects.js
   LƯU TRỮ: MongoDB (qua REST API backend)
   ========================================================================== */

import { db } from './mockData.js';
import { renderKanban } from './kanban.js';
import { updateWidgets } from './widgets.js';

const API_URL = "/api/projects";

export let projects = [];

export let currentProjectId = null;
export let currentProjectName = "Untitled Project";


/* ===========================
   INIT
=========================== */

export async function initProjects() {
    await fetchProjects();
    renderProjectsList();

    if (projects.length > 0) {
        const last = projects[projects.length - 1];
        await loadProject(last._id);
    }
}


/* ===========================
   API CALLS
=========================== */

async function fetchProjects() {
    try {
        const res = await fetch(API_URL);
        projects = await res.json();
    } catch (err) {
        console.error("Load projects error:", err);
    }
}

async function createProject(project) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project)
    });

    return await res.json();
}

async function updateProject(id, data) {
    await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
}

async function deleteProjectAPI(id) {
    await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
    });
}


/* ===========================
   SNAPSHOT
=========================== */

function createSnapshot() {
    return {
        boards: JSON.parse(JSON.stringify(db.boards || [])),
        tasks: JSON.parse(JSON.stringify(db.tasks || []))
    };
}


/* ===========================
   SAVE CURRENT PROJECT
=========================== */

export async function saveCurrentProject(name = null) {

    const projectName = name || currentProjectName;

    const snapshot = createSnapshot();

    if (currentProjectId) {

        await updateProject(currentProjectId, {
            name: projectName,
            snapshot
        });

    } else {

        const newProject = await createProject({
            name: projectName,
            snapshot,
            createdAt: new Date()
        });

        currentProjectId = newProject._id;
    }

    currentProjectName = projectName;

    await fetchProjects();
    renderProjectsList();

    updateWidgets();
}


/* ===========================
   CREATE NEW PROJECT
=========================== */

export async function createNewProject(name, color = "blue") {

    await saveCurrentProject();

    const project = await createProject({
        name,
        colorClass: color,
        snapshot: {
            boards: [],
            tasks: []
        },
        createdAt: new Date()
    });

    currentProjectId = project._id;
    currentProjectName = project.name;

    await fetchProjects();
    renderProjectsList();

    db.boards = [];
    db.tasks = [];

    renderKanban();
}


/* ===========================
   LOAD PROJECT
=========================== */

export async function loadProject(projectId) {

    try {

        const res = await fetch(`${API_URL}/${projectId}`);
        const proj = await res.json();

        if (!proj) return;

        db.boards = proj.snapshot.boards || [];
        db.tasks = proj.snapshot.tasks || [];

        currentProjectId = proj._id;
        currentProjectName = proj.name;

        renderKanban();
        updateWidgets();

    } catch (err) {
        console.error("Load project error:", err);
    }
}


/* ===========================
   DELETE PROJECT
=========================== */

export async function deleteProject(projectId) {

    if (!confirm("Xóa project này?")) return;

    await deleteProjectAPI(projectId);

    if (projectId === currentProjectId) {
        currentProjectId = null;
        currentProjectName = "Untitled Project";

        db.boards = [];
        db.tasks = [];

        renderKanban();
    }

    await fetchProjects();
    renderProjectsList();
}


/* ===========================
   RENDER PROJECT LIST
=========================== */

export function renderProjectsList() {

    const container = document.getElementById("projects-board-container");
    if (!container) return;

    if (projects.length === 0) {
        container.innerHTML = `
        <div style="padding:40px;text-align:center">
            Chưa có project nào
        </div>`;
        return;
    }

    container.innerHTML = projects.map(p => `
    
    <div class="project-card ${p._id === currentProjectId ? "current" : ""}">
    
        <strong>${p.name}</strong>
        
        <div class="project-actions">

            <button class="btn-load" data-id="${p._id}">
                Open
            </button>

            <button class="btn-delete" data-id="${p._id}">
                Delete
            </button>

        </div>

    </div>

    `).join("");

    attachProjectEvents();
}


/* ===========================
   EVENTS
=========================== */

function attachProjectEvents() {

    document.querySelectorAll(".btn-load")
        .forEach(btn => {

            btn.addEventListener("click", async e => {

                const id = e.target.dataset.id;

                await saveCurrentProject();
                await loadProject(id);

                document.getElementById("view-kanban").classList.remove("hidden");
            });

        });

    document.querySelectorAll(".btn-delete")
        .forEach(btn => {

            btn.addEventListener("click", async e => {

                const id = e.target.dataset.id;

                await deleteProject(id);

            });

        });
}