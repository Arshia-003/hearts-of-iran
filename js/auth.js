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
        showUserPanel();
    }, 1200);
}

async function handleRegister() {
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
        showUserPanel();
    }, 1200);
}

function updateUIForUser() {
    const registerBtnNav = $('registerBtnNav');
    const userBtnNav = $('userBtnNav');
    const chatBtnNav = $('chatBtnNav');

    if (currentUser) {
        if (registerBtnNav) registerBtnNav.style.display = 'none';
        if (userBtnNav) {
            userBtnNav.classList.add('show');
            userBtnNav.textContent = `👤 ${currentUser.username}`;
        }
        if (chatBtnNav) chatBtnNav.classList.add('show');
    } else {
        if (registerBtnNav) registerBtnNav.style.display = 'flex';
        if (userBtnNav) userBtnNav.classList.remove('show');
        if (chatBtnNav) chatBtnNav.classList.remove('show');
    }
}

function initSettings() {
    const settingsForm = $('settingsForm');
    if (!settingsForm) return;

    settingsForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!currentUser) { alert('لطفاً ابتدا وارد شوید!'); return; }

        const newUsername = $('settingsUsername').value.trim();
        const newPassword = $('settingsPassword').value.trim();
        const newCountry = $('settingsCountry').value;

        let hasError = false;
        const data = await getData();
        const usersList = data.users || [];

        if (newUsername.length < 3) {
            $('settingsUsernameError').textContent = 'نام کاربری باید حداقل ۳ کاراکتر باشد.';
            $('settingsUsernameError').classList.add('show');
            hasError = true;
        } else if (newUsername !== currentUser.username &&
            usersList.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
            $('settingsUsernameError').textContent = 'این نام کاربری قبلاً ثبت شده است!';
            $('settingsUsernameError').classList.add('show');
            hasError = true;
        } else {
            $('settingsUsernameError').classList.remove('show');
        }

        if (newPassword && newPassword.length < 6) {
            $('settingsPasswordError').textContent = 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
            $('settingsPasswordError').classList.add('show');
            hasError = true;
        } else {
            $('settingsPasswordError').classList.remove('show');
        }

        if (hasError) return;

        const idx = usersList.findIndex(u => u.email === currentUser.email);
        if (idx !== -1) {
            usersList[idx].username = newUsername;
            if (newPassword) usersList[idx].password = newPassword;
            usersList[idx].country = newCountry;
        }

        const admins = data.admins || [];
        const adminIdx = admins.indexOf(currentUser.username);
        if (adminIdx !== -1) admins[adminIdx] = newUsername;

        await updateData({ ...data, users: usersList, admins });

        const updatedUser = { ...currentUser, username: newUsername, country: newCountry };
        if (newPassword) updatedUser.password = newPassword;
        currentUser = updatedUser;
        saveSession(newUsername);

        updateUIForUser();
        if (typeof showUserPanel === 'function') showUserPanel();

        $('settingsSuccess').classList.add('show');
        setTimeout(() => {
            $('settingsSuccess').classList.remove('show');
            if (typeof closeSettings === 'function') closeSettings();
        }, 2000);
    });
}

function initAuth() {
    initAuthSwitch();
    initFormValidation();
    initRegisterForm();
    initSettings();
}
