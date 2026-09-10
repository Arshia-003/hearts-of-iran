// ============================================================
// HOME - منطق صفحه اصلی
// ============================================================

function showSection(section) {
    const homeSection = $('homeSection');
    const registerSection = $('registerSection');

    if (homeSection) homeSection.classList.add('hidden');
    if (registerSection) registerSection.classList.remove('active');

    if (section === 'home') {
        if (homeSection) homeSection.classList.remove('hidden');
    } else if (section === 'register') {
        if (registerSection) registerSection.classList.add('active');
    }
}

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
                window.location.href = 'panel.html';
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
                window.location.href = 'panel.html';
            }
        });
    }

    const themeToggleNav = $('themeToggleNav');
    if (themeToggleNav) {
        themeToggleNav.addEventListener('click', toggleTheme);
    }
}

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

async function initHome() {
    await loadTheme();
    await checkUserSession();
    updateUIForUser();
    initNavbar();
    initEventToggles();
    initAuth();

    showSection('home');

    console.log('🔥 Home page is ready!');
    console.log('👤 کاربر فعلی:', currentUser ? currentUser.username : 'خیر');
}

document.addEventListener('DOMContentLoaded', initHome);
