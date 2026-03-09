/* ==========================================================================
   FILE: public/js/auth.js
   CÔNG DỤNG: Gửi Request Đăng nhập/Đăng ký tới Node.js Backend
   ========================================================================== */
import { authAPI } from './mockData.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // Nếu đã đăng nhập thì đá thẳng vào index
    if (authAPI.getCurrentUser()) {
        window.location.href = 'index.html';
        return;
    }

    // Chuyển đổi Đăng nhập / Đăng ký
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    
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

    // Ẩn hiện mật khẩu
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', (e) => {
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

    // FORM ĐĂNG NHẬP
    const loginForm = document.getElementById('form-login');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btnSubmit = document.getElementById('btn-login-submit');
            
            btnSubmit.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Đang kết nối Server...`;
            btnSubmit.style.pointerEvents = 'none';

            // Gọi API MongoDB
            const res = await authAPI.login(email, password);

            if (res.success) {
                window.location.href = 'index.html';
            } else {
                alert(res.message);
                btnSubmit.innerHTML = `<span>Đăng nhập</span>`;
                btnSubmit.style.pointerEvents = 'auto';
            }
        });
    }

    // FORM ĐĂNG KÝ
    const registerForm = document.getElementById('form-register');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const pwd = document.getElementById('reg-password').value;
            const confirmPwd = document.getElementById('reg-confirm').value;
            const errorText = document.getElementById('pwd-error');
            const btnSubmit = document.getElementById('btn-register-submit');

            if (pwd !== confirmPwd) {
                errorText.classList.remove('hidden'); 
                return; 
            } else {
                errorText.classList.add('hidden'); 
            }

            btnSubmit.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Đang khởi tạo User...`;
            btnSubmit.style.pointerEvents = 'none';

            // Gọi API MongoDB
            const res = await authAPI.register(name, email, pwd);

            if (res.success) {
                alert("Đăng ký thành công! Vui lòng đăng nhập.");
                registerSection.classList.add('hidden');
                loginSection.classList.remove('hidden');
            } else {
                alert(res.message);
            }
            
            btnSubmit.innerHTML = `<span>Đăng ký tài khoản</span>`;
            btnSubmit.style.pointerEvents = 'auto';
        });
    }
});