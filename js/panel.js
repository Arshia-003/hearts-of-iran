// ============================================================
// PANEL - منطق پنل کاربری
// ============================================================

// ============================================================
// INIT PANEL
// ============================================================
async function initPanel() {
    console.log('🚀 شروع initPanel');

    await loadTheme();

    const sessionUsername = getSession();
    if (!sessionUsername) {
        alert('لطفاً ابتدا وارد شوید!');
        window.location.href = 'index.html';
        return;
    }

    const data = await getData();
    const users = data.users || [];
    const found = users.find(u => u.username === sessionUsername);

    if (!found) {
        clearSession();
        alert('⚠️ اکانت شما یافت نشد!');
        window.location.href = 'index.html';
        return;
    }

    currentUser = found;
    await setUserOnline(found.username, true);

    console.log('👤 کاربر:', currentUser.username);

    updateUIForUser();
    updatePanelUI();
    initNavbar();
    initSettings();
    initLogout();

    console.log('🔥 Panel is ready!');
}

// ============================================================
// UPDATE PANEL UI
// ============================================================
function updatePanelUI() {
    if (!currentUser) return;

    const panelUsername = $('panelUsername');
    const panelCountry = $('panelCountry');
    const panelFlag = $('panelFlag');
    const panelBg = $('panelBg');

    if (panelUsername) panelUsername.textContent = currentUser.username;
    if (panelCountry) panelCountry.textContent = `🎖️ کشور مورد علاقه: ${currentUser.country}`;
    if (panelFlag) panelFlag.src = `images/${flagMap[currentUser.country] || 'germany-flag.png'}`;
    if (panelBg) panelBg.style.backgroundImage =
        `url('images/${bgMap[currentUser.country] || 'germany-bg.jpg'}')`;
}

// ============================================================
// NAVBAR
// ============================================================
function initNavbar() {
    // دکمه پنل کاربری
    const userBtnNav = $('userBtnNav');
    if (userBtnNav) {
        userBtnNav.onclick = function() {
            location.reload();
        };
    }

    // دکمه چت روم
    const chatBtnNav = $('chatBtnNav');
    if (chatBtnNav) {
        chatBtnNav.onclick = function() {
            window.location.href = 'chat.html';
        };
    }

    // دکمه تم
    const themeToggleNav = $('themeToggleNav');
    if (themeToggleNav) {
        themeToggleNav.onclick = toggleTheme;
    }
}

// ============================================================
// SETTINGS
// ============================================================
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

        updatePanelUI();

        $('settingsSuccess').classList.add('show');
        setTimeout(() => {
            $('settingsSuccess').classList.remove('show');
            closeSettings();
        }, 2000);
    });
}

// ============================================================
// SETTINGS OPEN/CLOSE
// ============================================================
function openSettings() {
    if (!currentUser) { alert('لطفاً ابتدا وارد شوید!'); return; }

    const settingsOverlay = $('settingsOverlay');
    const settingsPanel = $('settingsPanel');
    if (settingsOverlay) settingsOverlay.classList.add('active');
    if (settingsPanel) settingsPanel.classList.add('active');

    const settingsUsername = $('settingsUsername');
    const settingsCountry = $('settingsCountry');
    const settingsPassword = $('settingsPassword');

    if (settingsUsername) settingsUsername.value = currentUser.username;
    if (settingsCountry) settingsCountry.value = currentUser.country;
    if (settingsPassword) settingsPassword.value = '';

    ['settingsSuccess', 'settingsUsernameError', 'settingsPasswordError'].forEach(id => {
        const el = $(id);
        if (el) el.classList.remove('show');
    });
}

function closeSettings() {
    const settingsOverlay = $('settingsOverlay');
    const settingsPanel = $('settingsPanel');
    if (settingsOverlay) settingsOverlay.classList.remove('active');
    if (settingsPanel) settingsPanel.classList.remove('active');
}

// ============================================================
// LOGOUT
// ============================================================
function initLogout() {
    const logoutConfirmBtn = $('logoutConfirmBtn');
    const logoutCancelBtn = $('logoutCancelBtn');
    const logoutOverlay = $('logoutOverlay');

    if (logoutConfirmBtn) {
        logoutConfirmBtn.onclick = handleLogout;
    }
    if (logoutCancelBtn) {
        logoutCancelBtn.onclick = () => {
            if (logoutOverlay) logoutOverlay.classList.remove('active');
        };
    }
    if (logoutOverlay) {
        logoutOverlay.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('active');
        });
    }
}

function openLogout() {
    const logoutOverlay = $('logoutOverlay');
    if (logoutOverlay) logoutOverlay.classList.add('active');
}

async function handleLogout() {
    await logoutUser();
    const logoutOverlay = $('logoutOverlay');
    if (logoutOverlay) logoutOverlay.classList.remove('active');
    alert('✅ شما با موفقیت خارج شدید!');
    window.location.href = 'index.html';
}

// ============================================================
// START
// ============================================================
document.addEventListener('DOMContentLoaded', initPanel);
