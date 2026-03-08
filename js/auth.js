/* ==========================================================================
   FILE: js/auth.js
   CÔNG DỤNG: Xử lý Đăng nhập, Đăng ký, Ẩn/Hiện mật khẩu và Lỗi Validate
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    
    // 1. CHUYỂN ĐỔI QUA LẠI GIỮA ĐĂNG NHẬP & ĐĂNG KÝ
    document.getElementById('link-to-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
    });

    document.getElementById('link-to-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    });

    // 2. TÍNH NĂNG ẨN/HIỆN MẬT KHẨU (Hỗ trợ nhiều ô input)
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', (e) => {
            // Lấy ID của ô input đang liên kết với icon này
            const targetId = e.target.getAttribute('data-target');
            const pwdInput = document.getElementById(targetId);
            
            if (pwdInput) {
                const type = pwdInput.getAttribute('type') === 'password' ? 'text' : 'password';
                pwdInput.setAttribute('type', type);
                
                e.target.classList.toggle('fa-eye');
                e.target.classList.toggle('fa-eye-slash');
            }
        });
    });

    // 3. XỬ LÝ SUBMIT FORM ĐĂNG NHẬP
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('btn-submit');
            
            btnSubmit.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Đang xác thực...`;
            btnSubmit.style.opacity = '0.8';
            btnSubmit.style.pointerEvents = 'none';

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        });
    }

    // 4. XỬ LÝ SUBMIT FORM ĐĂNG KÝ (Có Validate 2 mật khẩu)
    const registerForm = document.getElementById('form-register');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const pwd = document.getElementById('reg-password').value;
            const confirmPwd = document.getElementById('reg-confirm').value;
            const errorText = document.getElementById('pwd-error');
            const btnSubmit = document.getElementById('btn-register-submit');

            // Kiểm tra khớp mật khẩu
            if (pwd !== confirmPwd) {
                errorText.classList.remove('hidden'); // Hiện dòng chữ đỏ
                return; // Dừng lại, không cho gửi data đi
            } else {
                errorText.classList.add('hidden'); // Giấu dòng chữ đỏ đi
            }

            // Nếu mật khẩu khớp, giả lập gọi API đăng ký
            btnSubmit.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Đang tạo tài khoản...`;
            btnSubmit.style.opacity = '0.8';
            btnSubmit.style.pointerEvents = 'none';

            setTimeout(() => {
                alert("Đăng ký thành công! Đang chuyển hướng vào hệ thống...");
                window.location.href = 'index.html'; // Tạo xong cho vào thẳng app luôn
            }, 1200);
        });
    }
});