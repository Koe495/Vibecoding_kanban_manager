/* ==========================================================================
   FILE: public/js/mockData.js
   CÔNG DỤNG: Kết nối với MongoDB thông qua REST API. Đồng bộ thời gian thực.
   ========================================================================== */

const SESSION_KEY = 'TaskMaster_Mongo_Session';

// ============================================================================
// 1. API QUẢN LÝ XÁC THỰC
// ============================================================================
export const authAPI = {
    getCurrentUser: () => JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'),
    
    logout: () => {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = 'login.html';
    },

    login: async (email, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
        }
        return data;
    },

    register: async (name, email, password) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        return await res.json();
    }
};

// ============================================================================
// 2. HỆ THỐNG PROXY ĐỒNG BỘ DỮ LIỆU LÊN MONGODB (AUTO-SAVE)
// ============================================================================
let rawDb = {
    settings: { enableTaskDragDrop: true, hideCompletedTasks: false },
    boards: [], tasks: [], subjects: [], projects: []
};

let syncTimeout = null;
export let isInitializing = true; // Chặn lưu lên DB lúc mới tải trang

function triggerMongoSync() {
    if (isInitializing) return; // Đang tải dữ liệu gốc thì không gửi ngược lên
    
    clearTimeout(syncTimeout);
    // Debounce 1.5s: Đợi người dùng ngưng thao tác 1.5 giây mới gửi lên MongoDB để giảm tải server
    syncTimeout = setTimeout(async () => {
        const user = authAPI.getCurrentUser();
        if (!user) return;

        try {
            await fetch(`/api/data/${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rawDb)
            });
            console.log('💾 [MongoDB] Đã đồng bộ dữ liệu thành công!');
        } catch (error) {
            console.error('❌ Lỗi đồng bộ MongoDB:', error);
        }
    }, 1500);
}

// Deep Proxy theo dõi mọi sự thay đổi trong Object
function createDeepProxy(target) {
    if (typeof target !== 'object' || target === null) return target;
    const handler = {
        get(target, property, receiver) {
            const value = Reflect.get(target, property, receiver);
            return typeof value === 'object' && value !== null ? createDeepProxy(value) : value;
        },
        set(target, property, value, receiver) {
            const success = Reflect.set(target, property, value, receiver);
            if (success) triggerMongoSync();
            return success;
        },
        deleteProperty(target, property) {
            const success = Reflect.deleteProperty(target, property);
            if (success) triggerMongoSync();
            return success;
        }
    };
    return new Proxy(target, handler);
}

// Đối tượng db này được export ra ngoài. Bất cứ ai sửa db.tasks.push(...), Proxy sẽ tự chạy Auto-save
export const db = createDeepProxy(rawDb);

// ============================================================================
// 3. HÀM TẢI DỮ LIỆU TỪ MONGODB KHI KHỞI ĐỘNG ỨNG DỤNG
// ============================================================================
export async function initMongoDBData() {
    const user = authAPI.getCurrentUser();
    if (!user) return;

    isInitializing = true; // Bật cờ khóa
    try {
        const res = await fetch(`/api/data/${user.id}`);
        const data = await res.json();
        
        // Cập nhật dữ liệu vào rawDb (db proxy sẽ tự map sang)
        rawDb.settings = data.settings || rawDb.settings;
        rawDb.boards = data.boards || [];
        rawDb.tasks = data.tasks || [];
        rawDb.subjects = data.subjects || [];
        rawDb.projects = data.projects || [];
        
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ server:", error);
    }
    isInitializing = false; // Mở cờ khóa để bắt đầu theo dõi thao tác
}