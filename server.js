const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Yêu cầu Express phục vụ các file tĩnh (HTML, CSS, JS, hình ảnh) từ thư mục 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Nếu người dùng truy cập thư mục gốc, mặc định trả về trang login (hoặc index)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`TaskMaster Server đang chạy tại:`);
    console.log(`http://localhost:${PORT}`);
    console.log(`=================================================`);
});