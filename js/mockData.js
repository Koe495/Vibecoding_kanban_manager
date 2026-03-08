/* ==========================================================================
   FILE: mockData.js
   CÔNG DỤNG: Cung cấp mảng dữ liệu giả (Mock Data) chuẩn JSON.
   ========================================================================== */

export const db = {
    // 1. Dữ liệu các Bảng (Columns)
    boards: [
        { id: 'b1', title: 'dealine', color: 'pastel-red', order: 1 },
        { id: 'b2', title: 'Học tập', color: 'pastel-green', order: 2 },
        { id: 'b3', title: 'Dự án 66KHMT', color: 'pastel-blue', order: 3 }
    ],

    // 2. Dữ liệu Công việc (Tasks)
    tasks: [
        { 
            id: 't1', boardId: 'b1', title: 'Xong Frontend', 
            description: '', startDate: '2026-03-04', endDate: '2026-03-04', 
            priority: 'high', status: 'pending', location: 'Khu tự học 2' 
        },
        { 
            id: 't2', boardId: 'b2', title: 'Ôn OOP', 
            description: 'ôn lại private, public, porety j đó', startDate: '2026-03-04', endDate: '2026-03-04', 
            priority: 'high', status: 'pending', location: '' 
        },
        { 
            id: 't3', boardId: 'b2', title: 'học AI', 
            description: 'ôn thuật toán A*, Heuristic', startDate: '2026-03-04', endDate: '2026-03-04', 
            priority: 'medium', status: 'pending', location: 'Trọ' 
        },
        // Task giả lập đã hoàn thành để test khu vực 20%
        { 
            id: 't4', boardId: 'b1', title: 'Setup cấu trúc thư mục', 
            description: 'HTML, CSS, JS MVC', startDate: '2026-03-01', endDate: '2026-03-02', 
            priority: 'high', status: 'completed', location: '' 
        }
    ],

    // 3. Dữ liệu Thời khóa biểu (Timetable)
    subjects: [
        { id: 's1', day: 'Mon', startTime: '07:00', endTime: '09:30', title: 'Lập trình Python cho học máy', room: 'GĐ2' },
        { id: 's2', day: 'Tue', startTime: '13:00', endTime: '16:30', title: 'Cấu trúc dữ liệu và giải thuật', room: 'GĐ3' }
    ],

    // 4. Trạng thái cài đặt của người dùng
    settings: {
        hideCompletedTasks: false,
        hideCompletedBoards: false,
        enableTaskDragDrop: false // Mặc định là cố định
    }
};