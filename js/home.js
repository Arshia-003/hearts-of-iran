// ============================================================
// HOME - منطق صفحه اصلی
// ============================================================

// ============================================================
// NAVIGATION BETWEEN SECTIONS
// ============================================================
function showSection(section) {
    const homeSection = $('homeSection');
    const registerSection = $('registerSection');
    const userPanelSection = $('userPanelSection');

    if (homeSection) homeSection.classList.add('hidden');
    if (registerSection) registerSection.classList.remove('active');
    if (userPanelSection) userPanelSection.classList.remove('active');

    if (section === 'home') {
        if (homeSection) homeSection.classList.remove('hidden');
    } else if (section === 'register') {
        if (registerSection) registerSection.classList.add('active');
    } else if (section === 'userPanel') {
        if (userPanelSection) userPanelSection.classList.add('active');
    }
}

// ============================================================
// DISPLAY USER PANEL
// ============================================================
function showUserPanel() {
    const userPanelSection = $('userPanelSection');
    if (!userPanelSection) {
        console.error('❌ userPanelSection پیدا نشد!');
        return;
    }

    if (currentUser) {
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

    showSection('userPanel');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// NAVBAR LINKS
// ============================================================
function initNavbar() {
    const navLinks = document.querySelectorAll('nav a[data-target]');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.dataset.target;

            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            if (target === 'home') {
                showSection('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (target === 'events') {
                showSection('home');
                setTimeout(() => {
                    const eventsSection = $('eventsSection');
                    if (eventsSection) eventsSection.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        });
    });

    const registerBtnNav = $('registerBtnNav');
    if (registerBtnNav) {
        registerBtnNav.addEventListener('click', () => {
            if (currentUser) {
                showUserPanel();
            } else {
                showSection('register');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    const chatBtnNav = $('chatBtnNav');
    if (chatBtnNav) {
        chatBtnNav.addEventListener('click', () => {
            window.location.href = 'chat.html';
        });
    }

    const userBtnNav = $('userBtnNav');
    if (userBtnNav) {
        userBtnNav.addEventListener('click', () => {
            if (currentUser) {
                showUserPanel();
            }
        });
    }

    const themeToggleNav = $('themeToggleNav');
    if (themeToggleNav) {
        themeToggleNav.addEventListener('click', toggleTheme);
    }
}

// ============================================================
// EVENT TOGGLES
// ============================================================
function initEventToggles() {
    document.querySelectorAll('.event-toggle').forEach((btn) => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const detail = this.parentElement.querySelector('.detail-hidden');
            if (detail) {
                detail.classList.toggle('show');
                this.textContent = detail.classList.contains('show') ? '✕' : 'بیشتر بدانید';
            }
        });
    });
}

// ============================================================
// CHECK SESSION
// ============================================================
async function checkUserSession() {
    const sessionUsername = getSession();
    if (!sessionUsername) return false;

    const data = await getData();
    const users = data.users || [];
    const found = users.find(u => u.username === sessionUsername);

    if (found) {
        currentUser = found;
        await setUserOnline(found.username, true);
        return true;
    } else {
        clearSession();
        return false;
    }
}

// ============================================================
// LOGOUT FROM PANEL
// ============================================================
async function panelLogout() {
    if (currentUser) {
        await setUserOnline(currentUser.username, false);
    }
    currentUser = null;
    clearSession();
    updateUIForUser();
    showSection('home');
    alert('✅ شما با موفقیت خارج شدید!');
}

// ============================================================
// SETTINGS FROM PANEL
// ============================================================
function panelSettings() {
    if (!currentUser) {
        alert('لطفاً ابتدا وارد شوید!');
        return;
    }
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
}

// ============================================================
// CLOSE SETTINGS
// ============================================================
function closeSettings() {
    const settingsOverlay = $('settingsOverlay');
    const settingsPanel = $('settingsPanel');
    if (settingsOverlay) settingsOverlay.classList.remove('active');
    if (settingsPanel) settingsPanel.classList.remove('active');
}

// ============================================================
// INIT HOME PAGE
// ============================================================
async function initHome() {
    await loadTheme();
    await checkUserSession();
    updateUIForUser();
    initNavbar();
    initEventToggles();
    initAuth();
    initSettings();

    // ===== همیشه صفحه خانه رو نشون بده =====
    showSection('home');

    console.log('🔥 Home page is ready!');
    console.log('👤 کاربر فعلی:', currentUser ? currentUser.username : 'خیر');
}

document.addEventListener('DOMContentLoaded', initHome);
