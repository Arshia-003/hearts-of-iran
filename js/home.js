// ============================================================
// HOME - منطق صفحه اصلی
// ============================================================

// ============================================================
// NAVIGATION BETWEEN SECTIONS (Home, Register)
// ============================================================
function showSection(section) {
    const homeSection = $('homeSection');
    const registerSection = $('registerSection');

    if (!homeSection || !registerSection) return;

    if (section === 'home') {
        homeSection.classList.remove('hidden');
        registerSection.classList.remove('active');
    } else if (section === 'register') {
        homeSection.classList.add('hidden');
        registerSection.classList.add('active');
    }
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

    // دکمه ثبت‌نام در navbar
    const registerBtnNav = $('registerBtnNav');
    if (registerBtnNav) {
        registerBtnNav.addEventListener('click', () => {
            showSection('register');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // دکمه چت روم در navbar
    const chatBtnNav = $('chatBtnNav');
    if (chatBtnNav) {
        chatBtnNav.addEventListener('click', () => {
            window.location.href = 'chat.html';
        });
    }

    // دکمه پنل کاربری در navbar
    const userBtnNav = $('userBtnNav');
    if (userBtnNav) {
        userBtnNav.addEventListener('click', () => {
            window.location.href = 'chat.html';
        });
    }

    // دکمه تم
    const themeToggleNav = $('themeToggleNav');
    if (themeToggleNav) {
        themeToggleNav.addEventListener('click', toggleTheme);
    }
}

// ============================================================
// EVENT TOGGLES (رویدادهای کلیدی)
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
// CHECK SESSION (اگه کاربر لاگین بود، برو به چت)
// ============================================================
async function checkUserSession() {
    const sessionUsername = getSession();
    if (!sessionUsername) return false;

    const data = await getData();
    const users = data.users || [];
    const found = users.find(u => u.username === sessionUsername);

    if (found) {
        currentUser = found;
        // آپدیت آنلاین
        await setUserOnline(found.username, true);
        return true;
    } else {
        clearSession();
        return false;
    }
}

// ============================================================
// INIT HOME PAGE
// ============================================================
async function initHome() {
    // لود تم
    await loadTheme();

    // چک سشن
    await checkUserSession();

    // آپدیت UI
    updateUIForUser();

    // راه‌اندازی ناوبار
    initNavbar();

    // راه‌اندازی رویدادها
    initEventToggles();

    // راه‌اندازی auth
    initAuth();

    // نمایش صفحه خانه
    showSection('home');

    console.log('🔥 Home page is ready!');
    console.log('👤 کاربر فعلی:', currentUser ? currentUser.username : 'خیر');
}

// ============================================================
// اجرا وقتی صفحه لود شد
// ============================================================
document.addEventListener('DOMContentLoaded', initHome);
