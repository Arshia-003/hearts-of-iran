// ============================================================
// AUTH - ثبت‌نام، ورود، تنظیمات
// ============================================================

function validateField(input, errorEl, condition, errorMsg) {
    if (!input || !errorEl) return false;
    if (!condition) {
        input.classList.add('error');
        input.classList.remove('success');
        errorEl.textContent = errorMsg;
        errorEl.classList.add('show');
        return false;
    } else {
        input.classList.remove('error');
        input.classList.add('success');
        errorEl.classList.remove('show');
        return true;
    }
}

function initAuthSwitch() {
    const switchBtn = $('switchAuthBtn');
    if (!switchBtn) return;

    switchBtn.addEventListener('click', function() {
        isLoginMode = !isLoginMode;
        const authTitle = $('authTitle');
        const registerFields = $('registerFields');
        const loginFields = $('loginFields');
        const countryLabel = $('countryLabel');
        const countrySelect = $('country');
        const authSubmitBtn = $('authSubmitBtn');
        const successMsg = $('successMsg');
        const loginSuccessMsg = $('loginSuccessMsg');

        if (isLoginMode) {
            authTitle.textContent = '🔐 ورود به حساب کاربری';
            registerFields.style.display = 'none';
            loginFields.style.display = 'block';
            countryLabel.style.display = 'none';
            countrySelect.style.display = 'none';
            authSubmitBtn.textContent = '🚪 ورود';
            switchBtn.textContent = 'حساب کاربری ندارید؟ ثبت‌نام کنید';
            switchBtn.classList.add('login-btn');
        } else {
            authTitle.textContent = '📝 ساخت اکانت جدید';
            registerFields.style.display = 'block';
            loginFields.style.display = 'none';
            countryLabel.style.display = 'block';
            countrySelect.style.display = 'block';
            authSubmitBtn.textContent = '⚡ ساخت اکانت';
            switchBtn.textContent = 'آیا از قبل حساب کاربری دارید؟ وارد شوید';
            switchBtn.classList.remove('login-btn');
        }
        successMsg.classList.remove('show');
        loginSuccessMsg.classList.remove('show');
    });
}

function initFormValidation() {
    const usernameInput = $('username');
    const emailInput = $('email');
    const passwordInput = $('password');
    const loginUsernameInput = $('loginUsername');

    if (usernameInput) {
        usernameInput.addEventListener('input', function() {
            validateField(this, $('usernameError'), this.value.trim().length >= 3,
                'نام کاربری باید حداقل ۳ کاراکتر باشد.');
        });
    }

    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value.trim());
            validateField(this, $('emailError'), valid,
                'لطفاً یک ایمیل واقعی و معتبر وارد کنید.');
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            validateField(this, $('passwordError'), this.value.length >= 6,
                'رمز عبور باید حداقل ۶ کاراکتر باشد.');
        });
    }

    if (loginUsernameInput) {
        loginUsernameInput.addEventListener('input', function() {
            validateField(this, $('loginUsernameError'), this.value.trim().length > 0,
                'لطفاً نام کاربری یا ایمیل خود را وارد کنید.');
        });
    }
}

function initRegisterForm() {
    const form = $('registerForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (isLoginMode) {
            await handleLogin();
        } else {
            await handleRegister();
        }
    });
}

async function handleLogin() {
    const loginUsernameInput = $('loginUsername');
    const passwordInput = $('password');
    const loginSuccessMsg = $('loginSuccessMsg');

    const identifier = loginUsernameInput.value.trim();
    const password = passwordInput.value;

    const isLoginValid = identifier.length > 0;
    const isPasswordValid = password.length >= 6;

    validateField(loginUsernameInput, $('loginUsernameError'), isLoginValid,
        'لطفاً
