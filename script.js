// ============================================================
// JSONBin CONFIG
// ============================================================
const BIN_ID = '6aa1c487ffd5d16053f334a8';
const MASTER_KEY = '$2a$10$Aeo5..C6OPC7HvhrJihfQ.XJWcdz738W7cC3ZoIcPWMyGe9lJoaam';
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// ============================================================
// HELPERS
// ============================================================
async function getData() {
    try {
        const res = await fetch(API_URL + '/latest', {
            headers: { 'X-Master-Key': MASTER_KEY }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        return data.record || { messages: [], users: [] };
    } catch (e) {
        console.error('❌ خطا در دریافت:', e);
        return { messages: [], users: [] };
    }
}

async function updateData(data) {
    try {
        const res = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': MASTER_KEY
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
    } catch (e) {
        console.error('❌ خطا در آپدیت:', e);
        return null;
    }
}

// ============================================================
// DOM REFS
// ============================================================
const $ = id => document.getElementById(id);
const homeSection = $('homeSection');
const registerSection = $('registerSection');
const dashboardSection = $('dashboardSection');
const chatSection = $('chatSection');
const adminPanel = $('adminPanel');
const registerBtnNav = $('registerBtnNav');
const userBtnNav = $('userBtnNav');
const chatBtnNav = $('chatBtnNav');

// ============================================================
// STATE
// ============================================================
let currentUser = null;
let isLoginMode = false;
let chatInterval = null;
let userInterval = null;

// ============================================================
// ROLES & ADMIN LIST
// ============================================================
const ownerUsername = 'ArshiaT';
let adminList = [];

function loadAdminList() {
    try {
        const saved = localStorage.getItem('hoi4-admin-list');
        adminList = saved ? JSON.parse(saved) : [];
    } catch {
        adminList = [];
    }
}

function saveAdminList() {
    localStorage.setItem('hoi4-admin-list', JSON.stringify(adminList));
}

function getUserRole(username) {
    if (username === ownerUsername) return 'owner';
    if (adminList.includes(username)) return 'admin';
    return 'user';
}

function isOwner(username) { return username === ownerUsername; }
function isAdmin(username) { return adminList.includes(username) || isOwner(username); }

function canManageUsers(adminUsername, targetUsername) {
    if (isOwner(adminUsername)) return true;
    if (isAdmin(adminUsername) && !isAdmin(targetUsername) && adminUsername !== targetUsername) return true;
    return false;
}

function canManageMessages(username) { return isAdmin(username); }

loadAdminList();

// ============================================================
// THEME TOGGLE
// ============================================================
const themeToggleNav = $('themeToggleNav');
const themeIconNav = $('themeIconNav');
const themeLabelNav = $('themeLabelNav');
let currentTheme = localStorage.getItem('hoi4-theme') || 'dark';

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('hoi4-theme', theme);
    if (theme === 'light') {
        themeIconNav.textContent = '☀️';
        themeLabelNav.textContent = 'روشن';
    } else {
        themeIconNav.textContent = '🌙';
        themeLabelNav.textContent = 'تاریک';
    }
}

applyTheme(currentTheme);
themeToggleNav.addEventListener('click', () => applyTheme(currentTheme === 'dark' ? 'light' : 'dark'));

// ============================================================
// NAVIGATION
// ============================================================
const navLinks = document.querySelectorAll('nav a[data-target]');

function showSection(section) {
    homeSection.classList.add('hidden');
    registerSection.classList.remove('active');
    dashboardSection.classList.remove('active');
    chatSection.classList.remove('active');
    adminPanel.classList.remove('active');

    if (section === 'home') {
        homeSection.classList.remove('hidden');
    } else if (section === 'register') {
        registerSection.classList.add('active');
    } else if (section === 'dashboard') {
        dashboardSection.classList.add('active');
        updateDashboardUI();
    } else if (section === 'chat') {
        chatSection.classList.add('active');
        loadChatUsers();
        loadMessages();
    } else if (section === 'admin') {
        adminPanel.classList.add('active');
        loadAdminUsers();
    }
}

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
                $('eventsSection').scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    });
});

registerBtnNav.addEventListener('click', () => {
    showSection('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

userBtnNav.addEventListener('click', () => {
    if (currentUser) {
        showSection('dashboard');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

chatBtnNav.addEventListener('click', () => {
    if (!currentUser) { alert('لطفاً ابتدا وارد شوید!'); return; }
    showSection('chat');
    startIntervals();
});

// ============================================================
// EVENT TOGGLES
// ============================================================
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

// ============================================================
// AUTH SWITCH
// ============================================================
const switchBtn = $('switchAuthBtn');
const authTitle = $('authTitle');
const registerFields = $('registerFields');
const loginFields = $('loginFields');
const countryLabel = $('countryLabel');
const countrySelect = $('country');
const authSubmitBtn = $('authSubmitBtn');
const successMsg = $('successMsg');
const loginSuccessMsg = $('loginSuccessMsg');

switchBtn.addEventListener('click', function() {
    isLoginMode = !isLoginMode;
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

// ============================================================
// FORM VALIDATION
// ============================================================
const form = $('registerForm');
const usernameInput = $('username');
const emailInput = $('email');
const loginUsernameInput = $('loginUsername');
const passwordInput = $('password');

function validateField(input, errorEl, condition, errorMsg) {
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

usernameInput.addEventListener('input', function() {
    validateField(this, $('usernameError'), this.value.trim().length >= 3, 'نام کاربری باید حداقل ۳ کاراکتر باشد.');
});

emailInput.addEventListener('input', function() {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value.trim());
    validateField(this, $('emailError'), valid, 'لطفاً یک ایمیل واقعی و معتبر وارد کنید.');
});

passwordInput.addEventListener('input', function() {
    validateField(this, $('passwordError'), this.value.length >= 6, 'رمز عبور باید حداقل ۶ کاراکتر باشد.');
});

loginUsernameInput.addEventListener('input', function() {
    validateField(this, $('loginUsernameError'), this.value.trim().length > 0, 'لطفاً نام کاربری یا ایمیل خود را وارد کنید.');
});

// ============================================================
// DASHBOARD
// ============================================================
const flagMap = {
    'آلمان': 'germany-flag.png',
    'بریتانیا': 'uk-flag.png',
    'آمریکا': 'usa-flag.png',
    'ژاپن': 'japan-flag.png',
    'شوروی': 'soviet-flag.png',
    'ایتالیا': 'italy-flag.png',
    'فرانسه': 'france-flag.png'
};

const bgMap = {
    'آلمان': 'germany-bg.jpg',
    'بریتانیا': 'uk-bg.jpg',
    'آمریکا': 'usa-bg.jpg',
    'ژاپن': 'japan-bg.jpg',
    'شوروی': 'soviet-bg.jpg',
    'ایتالیا': 'italy-bg.jpg',
    'فرانسه': 'france-bg.jpg'
};

function updateDashboardUI() {
    if (currentUser) {
        $('dashboardUsername').textContent = currentUser.username;
        const country = currentUser.country;
        $('countryBadge').textContent = `🎖️ کشور مورد علاقه: ${country}`;
        $('countryFlag').src = `images/${flagMap[country] || 'germany-flag.png'}`;
        $('dashboardBg').style.backgroundImage = `url('images/${bgMap[country] || 'germany-bg.jpg'}')`;
    }
}

function updateUIForUser() {
    if (currentUser) {
        registerBtnNav.style.display = 'none';
        userBtnNav.classList.add('show');
        userBtnNav.textContent = `👤 ${currentUser.username}`;
        chatBtnNav.classList.add('show');
        updateAdminButton();
    } else {
        registerBtnNav.style.display = 'flex';
        userBtnNav.classList.remove('show');
        chatBtnNav.classList.remove('show');
    }
}

function updateAdminButton() {
    const btn = $('adminPanelBtn');
    if (currentUser && isOwner(currentUser.username)) {
        btn.style.display = 'block';
    } else {
        btn.style.display = 'none';
    }
}

// ============================================================
// REGISTER / LOGIN SUBMIT
// ============================================================
form.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (isLoginMode) {
        // ===== LOGIN =====
        const identifier = loginUsernameInput.value.trim();
        const password = passwordInput.value;

        const isLoginValid = identifier.length > 0;
        const isPasswordValid = password.length >= 6;

        validateField(loginUsernameInput, $('loginUsernameError'), isLoginValid, 'لطفاً نام کاربری یا ایمیل خود را وارد کنید.');
        validateField(passwordInput, $('passwordError'), isPasswordValid, 'رمز عبور باید حداقل ۶ کاراکتر باشد.');

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
        localStorage.setItem('hoi4-user', JSON.stringify(found));

        // آپدیت آنلاین در JSONBin
        const updatedUsers = users.map(u => u.username === found.username ? { ...u, online: true } : u);
        await updateData({ ...data, users: updatedUsers });

        loginSuccessMsg.style.display = 'block';
        loginSuccessMsg.textContent = '✅ ورود با موفقیت انجام شد!';
        loginSuccessMsg.classList.add('show');
        updateUIForUser();

        setTimeout(() => {
            loginSuccessMsg.classList.remove('show');
            loginSuccessMsg.style.display = 'none';
            showSection('dashboard');
        }, 1500);

    } else {
        // ===== REGISTER =====
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const country = countrySelect.value;

        const isUsernameValid = username.length >= 3;
        const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const isPasswordValid = password.length >= 6;

        validateField(usernameInput, $('usernameError'), isUsernameValid, 'نام کاربری باید حداقل ۳ کاراکتر باشد.');
        validateField(emailInput, $('emailError'), isEmailValid, 'لطفاً یک ایمیل واقعی و معتبر وارد کنید.');
        validateField(passwordInput, $('passwordError'), isPasswordValid, 'رمز عبور باید حداقل ۶ کاراکتر باشد.');

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
        localStorage.setItem('hoi4-user', JSON.stringify(newUser));

        successMsg.textContent = '✅ اکانت شما با موفقیت ساخته شد!';
        successMsg.classList.add('show');
        updateUIForUser();
        form.reset();

        setTimeout(() => {
            successMsg.classList.remove('show');
            showSection('dashboard');
        }, 1500);
    }
});

// ============================================================
// CHAT SYSTEM
// ============================================================
async function sendMessage() {
    const input = $('chatInput');
    const text = input.value.trim();
    if (!text) return;
    if (!currentUser) { alert('لطفاً ابتدا وارد شوید!'); return; }

    const data = await getData();
    const messages = data.messages || [];

    messages.push({
        username: currentUser.username,
        text: text,
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
    });

    await updateData({ ...data, messages });
    input.value = '';
    loadMessages();
}

async function loadMessages() {
    const data = await getData();
    const messages = data.messages || [];
    const container = $('chatMessages');

    if (messages.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:var(--text-secondary); padding:40px 0;">هنوز پیامی ارسال نشده است</div>';
        return;
    }

    let html = '';
    messages.forEach((msg, index) => {
        const isOwn = currentUser && msg.username === currentUser.username;
        const canModerate = currentUser && canManageMessages(currentUser.username);
        html += `
            <div class="message ${isOwn ? 'own' : ''}">
                <div class="msg-user">${msg.username}</div>
                <div class="msg-text">${msg.text}</div>
                <div class="msg-time">${msg.time}</div>
                ${canModerate && !isOwn ? `
                    <div style="margin-top:6px; display:flex; gap:6px; flex-wrap:wrap;">
                        <button onclick="deleteMessage(${index})" style="background:#ff4444; color:#fff; border:none; padding:2px 12px; border-radius:14px; font-size:0.7rem; cursor:pointer; font-weight:700;">🗑️ حذف</button>
                        <button onclick="timeoutUser('${msg.username}')" style="background:#ffaa00; color:#0b0e14; border:none; padding:2px 12px; border-radius:14px; font-size:0.7rem; cursor:pointer; font-weight:700;">⏰ تایم‌اوت</button>
                    </div>
                ` : ''}
            </div>
        `;
    });

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

async function loadChatUsers() {
    if (!currentUser) return;

    const data = await getData();
    const users = data.users || [];
    const container = $('usersListContainer');

    // آپدیت آنلاین کاربر جاری
    const updatedUsers = users.map(u => u.username === currentUser.username ? { ...u, online: true } : u);
    await updateData({ ...data, users: updatedUsers });

    const onlineList = updatedUsers.filter(u => u.online === true);
    const offlineList = updatedUsers.filter(u => u.online !== true);

    // مرتب‌سازی آنلاین‌ها
    onlineList.sort((a, b) => {
        const roleA = getUserRole(a.username);
        const roleB = getUserRole(b.username);
        if (roleA === 'owner') return -1;
        if (roleB === 'owner') return 1;
        if (roleA === 'admin' && roleB !== 'admin') return -1;
        if (roleB === 'admin' && roleA !== 'admin') return 1;
        return 0;
    });

    let html = '';

    if (onlineList.length > 0) {
        onlineList.forEach(u => {
            const role = getUserRole(u.username);
            let roleLabel = '';
            if (role === 'owner') roleLabel = '<span class="user-role owner">مدیر</span>';
            else if (role === 'admin') roleLabel = '<span class="user-role admin">ادمین</span>';
            html += `
                <div class="user-item">
                    <span class="status-dot online"></span>
                    <span class="username">${u.username}</span>
                    ${roleLabel}
                </div>
            `;
        });
    }

    if (onlineList.length > 0 && offlineList.length > 0) {
        html += `<hr class="divider" />`;
    }

    if (offlineList.length > 0) {
        offlineList.forEach(u => {
            const role = getUserRole(u.username);
            let roleLabel = '';
            if (role === 'owner') roleLabel = '<span class="user-role owner">مدیر</span>';
            else if (role === 'admin') roleLabel = '<span class="user-role admin">ادمین</span>';
            html += `
                <div class="user-item">
                    <span class="status-dot offline"></span>
                    <span class="username">${u.username}</span>
                    ${roleLabel}
                </div>
            `;
        });
    }

    if (updatedUsers.length === 0) {
        html = '<div style="text-align:center; color:var(--text-secondary); padding:20px;">هیچ کاربری ثبت‌نام نکرده است</div>';
    }

    container.innerHTML = html;
}

// ============================================================
// INTERVALS
// ============================================================
function startIntervals() {
    stopIntervals();
    chatInterval = setInterval(() => {
        if (chatSection.classList.contains('active')) loadMessages();
    }, 5000);
    userInterval = setInterval(() => {
        if (chatSection.classList.contains('active')) loadChatUsers();
    }, 10000);
}

function stopIntervals() {
    if (chatInterval) clearInterval(chatInterval);
    if (userInterval) clearInterval(userInterval);
    chatInterval = null;
    userInterval = null;
}

// ============================================================
// ADMIN CHAT ACTIONS
// ============================================================
window.deleteMessage = async function(index) {
    if (!confirm('آیا از حذف این پیام مطمئن هستید؟')) return;
    const data = await getData();
    const messages = data.messages || [];
    messages.splice(index, 1);
    await updateData({ ...data, messages });
    loadMessages();
};

function getTimedOutUsers() {
    try { return JSON.parse(localStorage.getItem('hoi4-timedout-users')) || []; } catch { return []; }
}

function saveTimedOutUsers(users) {
    localStorage.setItem('hoi4-timedout-users', JSON.stringify(users));
}

window.timeoutUser = function(username) {
    if (!confirm(`آیا میخواهید "${username}" را ۵ دقیقه تایم‌اوت کنید؟`)) return;
    const timedOut = getTimedOutUsers();
    if (!timedOut.includes(username)) {
        timedOut.push(username);
        saveTimedOutUsers(timedOut);
    }
    alert(`⏰ "${username}" به مدت ۵ دقیقه تایم‌اوت شد!`);
    setTimeout(() => {
        const newList = getTimedOutUsers().filter(u => u !== username);
        saveTimedOutUsers(newList);
    }, 300000);
};

// ============================================================
// ADMIN PANEL
// ============================================================
window.openAdminPanel = function() {
    if (!currentUser || !isOwner(currentUser.username)) {
        alert('شما دسترسی مدیر ندارید!');
        return;
    }
    showSection('admin');
};

window.closeAdminPanel = function() {
    showSection('dashboard');
};

async function loadAdminUsers() {
    const data = await getData();
    const users = data.users || [];
    const container = $('adminUsersList');

    if (users.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);">هیچ کاربری ثبت‌نام نکرده است.</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>نام کاربری</th>
                    <th>ایمیل</th>
                    <th>کشور</th>
                    <th>تاریخ ثبت</th>
                    <th>نقش</th>
                    <th>عملیات</th>
                </tr>
            </thead>
            <tbody>
    `;

    users.forEach(u => {
        const role = getUserRole(u.username);
        const isCurrentUser = u.username === currentUser.username;
        let roleLabel = '', roleClass = '';
        if (role === 'owner') { roleLabel = 'مدیر'; roleClass = 'owner'; }
        else if (role === 'admin') { roleLabel = 'ادمین'; roleClass = 'admin'; }
        else { roleLabel = 'کاربر'; roleClass = 'user'; }

        const canDelete = canManageUsers(currentUser.username, u.username);

        html += `
            <tr>
                <td><strong>${u.username}</strong> ${role === 'owner' ? '⭐' : ''}</td>
                <td>${u.email}</td>
                <td>${u.country}</td>
                <td>${u.date || 'نامشخص'}</td>
                <td><span class="role-badge ${roleClass}">${roleLabel}</span></td>
                <td>
                    ${!isCurrentUser && canDelete ? `
                        ${role !== 'owner' && isOwner(currentUser.username) ? `
                            <button class="action-btn ${role === 'admin' ? 'remove-admin' : 'make-admin'}" 
                                    onclick="${role === 'admin' ? `removeAdmin('${u.username}')` : `makeAdmin('${u.username}')`}">
                                ${role === 'admin' ? '⬇️ حذف ادمین' : '👑 ادمین کن'}
                            </button>
                        ` : ''}
                        <button class="action-btn delete" onclick="deleteUser('${u.username}')">🗑️ حذف</button>
                    ` : `
                        <span style="color:var(--text-secondary); font-size:0.8rem;">
                            ${isCurrentUser ? 'خودتان' : 'دسترسی ندارید'}
                        </span>
                    `}
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

window.deleteUser = async function(username) {
    if (!canManageUsers(currentUser.username, username)) {
        alert('شما دسترسی حذف این کاربر را ندارید!');
        return;
    }
    if (username === currentUser.username) { alert('نمیتوانید خودتان را حذف کنید!'); return; }
    if (!confirm(`آیا از حذف کاربر "${username}" مطمئن هستید؟`)) return;
    if (isOwner(username)) { alert('نمیتوانید مدیر اصلی را حذف کنید!'); return; }

    const data = await getData();
    const users = data.users || [];
    const updatedUsers = users.filter(u => u.username !== username);
    await updateData({ ...data, users: updatedUsers });

    adminList = adminList.filter(u => u !== username);
    saveAdminList();

    const timedOut = getTimedOutUsers().filter(u => u !== username);
    saveTimedOutUsers(timedOut);

    loadAdminUsers();
    loadChatUsers();
    alert(`✅ کاربر "${username}" با موفقیت حذف شد!`);
};

window.makeAdmin = function(username) {
    if (!confirm(`آیا میخواهید "${username}" را ادمین کنید؟`)) return;
    if (isOwner(username)) { alert('این کاربر مدیر اصلی است!'); return; }
    if (!adminList.includes(username)) {
        adminList.push(username);
        saveAdminList();
    }
    loadAdminUsers();
    loadChatUsers();
    alert(`✅ "${username}" به لیست ادمین‌ها اضافه شد!`);
};

window.removeAdmin = function(username) {
    if (!confirm(`آیا میخواهید ادمین بودن "${username}" را لغو کنید؟`)) return;
    if (isOwner(username)) { alert('نمیتوانید مدیر اصلی را تغییر دهید!'); return; }
    adminList = adminList.filter(u => u !== username);
    saveAdminList();
    loadAdminUsers();
    loadChatUsers();
    alert(`✅ ادمین بودن "${username}" لغو شد!`);
};

// ============================================================
// CLOSE CHAT
// ============================================================
window.closeChat = async function() {
    if (currentUser) {
        const data = await getData();
        const users = data.users || [];
        const updatedUsers = users.map(u => u.username === currentUser.username ? { ...u, online: false } : u);
        await updateData({ ...data, users: updatedUsers });
    }
    stopIntervals();
    showSection('dashboard');
};

$('sendChatBtn').addEventListener('click', sendMessage);
$('chatInput').addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

// ============================================================
// LOGOUT
// ============================================================
async function handleLogout() {
    if (currentUser) {
        const data = await getData();
        const users = data.users || [];
        const updatedUsers = users.map(u => u.username === currentUser.username ? { ...u, online: false } : u);
        await updateData({ ...data, users: updatedUsers });
    }
    stopIntervals();
    currentUser = null;
    localStorage.removeItem('hoi4-user');
    updateUIForUser();
    showSection('home');
    $('logoutOverlay').classList.remove('active');
    alert('✅ شما با موفقیت خارج شدید!');
}

window.openLogout = function() {
    if (!currentUser) { alert('لطفاً ابتدا وارد شوید!'); return; }
    $('logoutOverlay').classList.add('active');
};

$('logoutConfirmBtn').addEventListener('click', handleLogout);
$('logoutCancelBtn').addEventListener('click', () => $('logoutOverlay').classList.remove('active'));
$('logoutOverlay').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
});

// ============================================================
// SETTINGS
// ============================================================
window.openSettings = function() {
    if (!currentUser) { alert('لطفاً ابتدا وارد شوید!'); return; }
    $('settingsOverlay').classList.add('active');
    $('settingsPanel').classList.add('active');
    $('settingsUsername').value = currentUser.username;
    $('settingsCountry').value = currentUser.country;
    $('settingsPassword').value = '';
    $('settingsSuccess').classList.remove('show');
    $('settingsError').classList.remove('show');
    $('settingsUsernameError').classList.remove('show');
    $('settingsPasswordError').classList.remove('show');
};

window.closeSettings = function() {
    $('settingsOverlay').classList.remove('active');
    $('settingsPanel').classList.remove('active');
};

const settingsForm = $('settingsForm');
const settingsUsername = $('settingsUsername');
const settingsPassword = $('settingsPassword');
const settingsCountry = $('settingsCountry');
const settingsUsernameError = $('settingsUsernameError');
const settingsPasswordError = $('settingsPasswordError');
const settingsSuccess = $('settingsSuccess');
const settingsError = $('settingsError');

settingsForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!currentUser) { alert('لطفاً ابتدا وارد شوید!'); return; }

    const newUsername = settingsUsername.value.trim();
    const newPassword = settingsPassword.value.trim();
    const newCountry = settingsCountry.value;

    let hasError = false;
    let usersList = await getData().then(d => d.users || []);

    if (newUsername.length < 3) {
        settingsUsernameError.textContent = 'نام کاربری باید حداقل ۳ کاراکتر باشد.';
        settingsUsernameError.classList.add('show');
        hasError = true;
    } else if (newUsername !== currentUser.username &&
        usersList.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
        settingsUsernameError.textContent = 'این نام کاربری قبلاً ثبت شده است!';
        settingsUsernameError.classList.add('show');
        hasError = true;
    } else {
        settingsUsernameError.classList.remove('show');
    }

    if (newPassword && newPassword.length < 6) {
        settingsPasswordError.textContent = 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
        settingsPasswordError.classList.add('show');
        hasError = true;
    } else {
        settingsPasswordError.classList.remove('show');
    }

    if (hasError) {
        settingsSuccess.classList.remove('show');
        settingsError.classList.remove('show');
        return;
    }

    // آپدیت در JSONBin
    const data = await getData();
    const users = data.users || [];
    const idx = users.findIndex(u => u.email === currentUser.email);

    if (idx !== -1) {
        users[idx].username = newUsername;
        if (newPassword) users[idx].password = newPassword;
        users[idx].country = newCountry;
        await updateData({ ...data, users });
    }

    const updatedUser = { ...currentUser, username: newUsername, country: newCountry };
    if (newPassword) updatedUser.password = newPassword;
    currentUser = updatedUser;
    localStorage.setItem('hoi4-user', JSON.stringify(updatedUser));

    updateUIForUser();
    updateDashboardUI();

    settingsSuccess.classList.add('show');
    settingsError.classList.remove('show');
    setTimeout(() => {
        settingsSuccess.classList.remove('show');
        closeSettings();
    }, 2000);
});

// ============================================================
// INIT
// ============================================================
const savedUser = localStorage.getItem('hoi4-user');
if (savedUser) {
    try {
        currentUser = JSON.parse(savedUser);
        // آپدیت آنلاین
        (async () => {
            const data = await getData();
            const users = data.users || [];
            const updatedUsers = users.map(u => u.username === currentUser.username ? { ...u, online: true } : u);
            await updateData({ ...data, users: updatedUsers });
        })();
    } catch (e) {
        currentUser = null;
        localStorage.removeItem('hoi4-user');
    }
}

updateUIForUser();

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSettings();
        $('logoutOverlay').classList.remove('active');
    }
});

console.log('🔥 JSONBin Chat is ready!');
console.log('📦 Bin ID:', BIN_ID);
console.log('👤 Current User:', currentUser ? currentUser.username : 'خیر');
