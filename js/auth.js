// ============================================================
// AUTH - ثبت‌نام، ورود (برای index.html)
// ============================================================

// ============================================================
// FORM VALIDATION
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

// ============================================================
// SWITCH BETWEEN REGISTER & LOGIN
// ============================================================
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

// ============================================================
// FORM VALIDATION LISTENERS
// ============================================================
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

// ============================================================
// REGISTER / LOGIN SUBMIT
// ============================================================
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

// ============================================================
// LOGIN
// ============================================================
async function handleLogin() {
    console.log('🔐 شروع ورود...');

    const loginUsernameInput = $('loginUsername');
    const passwordInput = $('password');
    const loginSuccessMsg = $('loginSuccessMsg');

    const identifier = loginUsernameInput.value.trim();
    const password = passwordInput.value;

    const isLoginValid = identifier.length > 0;
    const isPasswordValid = password.length >= 6;

    validateField(loginUsernameInput, $('loginUsernameError'), isLoginValid,
        'لطفاً نام کاربری یا ایمیل خود را وارد کنید.');
    validateField(passwordInput, $('passwordError'), isPasswordValid,
        'رمز عبور باید حداقل ۶ کاراکتر باشد.');

    if (!isLoginValid || !isPasswordValid) return;

    const data = await getData();
    const users = data.users || [];
    const found = users.find(u =>
        (u.username.toLowerCase() === identifier.toLowerCase() ||
            u.email.toLowerCase() === identifier.toLowerCase()) &&
        u.password === password
    );

    if (!found) {
        loginUsernameInput.classList.add('error');
        $('loginUsernameError').textContent = 'نام کاربری، ایمیل یا رمز عبور اشتباه است!';
        $('loginUsernameError').classList.add('show');
        loginSuccessMsg.classList.remove('show');
        return;
    }

    currentUser = found;
    saveSession(found.username);
    await setUserOnline(found.username, true);

    loginSuccessMsg.style.display = 'block';
    loginSuccessMsg.textContent = '✅ ورود با موفقیت انجام شد!';
    loginSuccessMsg.classList.add('show');
    updateUIForUser();

    setTimeout(() => {
        loginSuccessMsg.classList.remove('show');
        loginSuccessMsg.style.display = 'none';
        console.log('👤 رفتن به پنل کاربری...');
        window.location.href = 'panel.html';
    }, 1200);
}

// ============================================================
// REGISTER
// ============================================================
async function handleRegister() {
    console.log('📝 شروع ثبت‌نام...');

    const usernameInput = $('username');
    const emailInput = $('email');
    const passwordInput = $('password');
    const countrySelect = $('country');
    const successMsg = $('successMsg');

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const country = countrySelect.value;

    const isUsernameValid = username.length >= 3;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPasswordValid = password.length >= 6;

    validateField(usernameInput, $('usernameError'), isUsernameValid,
        'نام کاربری باید حداقل ۳ کاراکتر باشد.');
    validateField(emailInput, $('emailError'), isEmailValid,
        'لطفاً یک ایمیل واقعی و معتبر وارد کنید.');
    validateField(passwordInput, $('passwordError'), isPasswordValid,
        'رمز عبور باید حداقل ۶ کاراکتر باشد.');

    if (!isUsernameValid || !isEmailValid || !isPasswordValid) return;

    const data = await getData();
    const users = data.users || [];

    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        usernameInput.classList.add('error');
        $('usernameError').textContent = 'این نام کاربری قبلاً ثبت‌نام شده است!';
        $('usernameError').classList.add('show');
        return;
    }

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        emailInput.classList.add('error');
        $('emailError').textContent = 'این ایمیل قبلاً ثبت‌نام شده است!';
        $('emailError').classList.add('show');
        return;
    }

    const newUser = {
        username,
        email,
        password,
        country,
        date: new Date().toLocaleDateString('fa-IR'),
        online: true
    };

    users.push(newUser);
    await updateData({ ...data, users });

    currentUser = newUser;
    saveSession(newUser.username);

    successMsg.textContent = '✅ اکانت شما با موفقیت ساخته شد!';
    successMsg.classList.add('show');
    updateUIForUser();
    $('registerForm').reset();

    setTimeout(() => {
        successMsg.classList.remove('show');
        console.log('👤 رفتن به پنل کاربری (ثبت‌نام)...');
        window.location.href = 'panel.html';
    }, 1200);
}

// ============================================================
// INIT AUTH
// ============================================================
function initAuth() {
    initAuthSwitch();
    initFormValidation();
    initRegisterForm();
}
