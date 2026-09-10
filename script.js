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
        return data.record || { messages: [], users: [], admins: [], timedOut: [], theme: 'dark' };
    } catch (e) {
        console.error('❌ خطا در دریافت:', e);
        return { messages: [], users: [], admins: [], timedOut: [], theme: 'dark' };
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
// SESSION MANAGEMENT (فقط برای لاگین - بدون localStorage)
// ============================================================
function saveSession(username) {
    sessionStorage.setItem('hoi4-session', username);
}

function getSession() {
    return sessionStorage.getItem('hoi4-session');
}

function clearSession() {
    sessionStorage.removeItem('hoi4-session');
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
let checkInterval = null;

// ============================================================
// THEME
// ============================================================
async function loadTheme() {
    const data = await getData();
    const theme = data.theme || 'dark';
    applyTheme(theme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeIconNav = $('themeIconNav');
    const themeLabelNav = $('themeLabelNav');
    if (theme === 'light') {
        themeIconNav.textContent = '☀️';
        themeLabelNav.textContent = 'روشن';
    } else {
        themeIconNav.textContent = '🌙';
        themeLabelNav.textContent = 'تاریک';
    }
}

$('themeToggleNav').addEventListener('click', async function() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    
    // ذخیره توی JSONBin
    const data = await getData();
    data.theme = nextTheme;
    await updateData(data);
});

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
                const eventsSection = $('eventsSection');
                if (eventsSection) eventsSection.scrollIntoView({ behavior: 'smooth' });
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
    if (currentUser && currentUser.username === 'ArshiaT') {
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

        // ذخیره در session
        currentUser = found;
        saveSession(found.username);

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
        saveSession(newUser.username);

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

    // چک کردن وجود کاربر
    const data = await getData();
    const users = data.users || [];
    if (!users.some(u => u.username === currentUser.username)) {
        alert('⚠️ اکانت شما حذف شده است!');
        handleDeletedAccount();
        return;
    }

    // چک تایم‌اوت
    const timedOut = data.timedOut || [];
    if (timedOut.includes(currentUser.username)) {
        alert('⏰ شما توسط ادمین تایم‌اوت شده‌اید و نمی‌توانید پیام بفرستید!');
        return;
    }

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
        const canModerate = currentUser && (currentUser.username === 'ArshiaT' || (data.admins || []).includes(currentUser.username));
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
    const admins = data.admins || [];

    // آپدیت آنلاین کاربر جاری
    const updatedUsers = users.map(u => u.username === currentUser.username ? { ...u, online: true } : u);
    await updateData({ ...data, users: updatedUsers });

    const onlineList = updatedUsers.filter(u => u.online === true);
    const offlineList = updatedUsers.filter(u => u.online !== true);

    // مرتب‌سازی آنلاین‌ها
    onlineList.sort((a, b) => {
        const roleA = a.username === 'ArshiaT' ? 'owner' : (admins.includes(a.username) ? 'admin' : 'user');
        const roleB = b.username === 'ArshiaT' ? 'owner' : (admins.includes(b.username) ? 'admin' : 'user');
        if (roleA === 'owner') return -1;
        if (roleB === 'owner') return 1;
        if (roleA === 'admin' && roleB !== 'admin') return -1;
        if (roleB === 'admin' && roleA !== 'admin') return 1;
        return 0;
    });

    let html = '';

    if (onlineList.length > 0) {
        onlineList.forEach(u => {
            const role = u.username === 'ArshiaT' ? 'owner' : (admins.includes(u.username) ? 'admin' : 'user');
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
            const role = u.username === 'ArshiaT' ? 'owner' : (admins.includes(u.username) ? 'admin' : 'user');
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
// AUTO LOGOUT - چک کردن وجود کاربر در JSONBin
// ============================================================
async function checkUserExists() {
    if (!currentUser) return;

    try {
        const data = await getData();
        const users = data.users || [];
        
        const userExists = users.some(u => u.username === currentUser.username);
        
        if (!userExists) {
            console.log('⚠️ اکانت حذف شده!');
            handleDeletedAccount();
        }
    } catch (e) {
        console.error('❌ خطا در چک کردن کاربر:', e);
    }
}

function handleDeletedAccount() {
    // بستن همه interval‌ها
    stopIntervals();
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
    }
    
    // پاک کردن کاربر و session
    currentUser = null;
    clearSession();
    updateUIForUser();
    showSection('home');
    
    // پیام به کاربر
    alert('⚠️ اکانت شما توسط مدیر حذف شده است!');
    
    // رفرش
    location.reload();
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

window.timeoutUser = async function(username) {
    if (!confirm(`آیا می‌خواهید "${username}" را ۵ دقیقه تایم‌اوت کنید؟`)) return;
    const data = await getData();
    const timedOut = data.timedOut || [];
    if (!timedOut.includes(username)) {
        timedOut.push(username);
        await updateData({ ...data, timedOut });
    }
    alert(`⏰ "${username}" به مدت ۵ دقیقه تایم‌اوت شد!`);
    setTimeout(async () => {
        const freshData = await getData();
        const newList = (freshData.timedOut || []).filter(u => u !== username);
        await updateData({ ...freshData, timedOut: newList });
    }, 300000);
};

// ============================================================
// ADMIN PANEL
// ============================================================
window.openAdminPanel = function() {
    if (!currentUser || currentUser.username !== 'ArshiaT') {
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
    const admins = data.admins || [];
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
        const isOwnerUser = u.username === 'ArshiaT';
        const isAdminUser = admins.includes(u.username);
        const isCurrentUser = u.username === currentUser.username;
        
        let roleLabel = 'کاربر', roleClass = 'user';
        if (isOwnerUser) { roleLabel = 'مدیر'; roleClass = 'owner'; }
        else if (isAdminUser) { roleLabel = 'ادمین'; roleClass = 'admin'; }

        const canDelete = currentUser.username === 'ArshiaT' && !isOwnerUser && !isCurrentUser;

        html += `
            <tr>
                <td><strong>${u.username}</strong> ${isOwnerUser ? '⭐' : ''}</td>
                <td>${u.email}</td>
                <td>${u.country}</td>
                <td>${u.date || 'نامشخص'}</td>
                <td><span class="role-badge ${roleClass}">${roleLabel}</span></td>
                <td>
                    ${canDelete ? `
                        ${!isAdminUser ? `
                            <button class="action-btn make-admin" onclick="makeAdmin('${u.username}')">👑 ادمین کن</button>
                        ` : `
                            <button class="action-btn remove-admin" onclick="removeAdmin('${u.username}')">⬇️ حذف ادمین</button>
                        `}
                        <button class="action-btn delete" onclick="deleteUser('${u.username}')">🗑️ حذف</button>
                    ` : `
                        <span style="color:var(--text-secondary); font-size:0.8rem;">
                            ${isCurrentUser ? 'خودتان' : (isOwnerUser ? 'مدیر اصلی' : 'دسترسی ندارید')}
                        </span>
                    `}
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// ============================================================
// DELETE USER - کاملاً از JSONBin
// ============================================================
window.deleteUser = async function(username) {
    if (currentUser.username !== 'ArshiaT') {
        alert('❌ فقط مدیر اصلی می‌تواند کاربران را حذف کند!');
        return;
    }
    if (username === currentUser.username) {
        alert('❌ نمی‌توانید خودتان را حذف کنید!');
        return;
    }
    if (username === 'ArshiaT') {
        alert('❌ نمی‌توانید مدیر اصلی را حذف کنید!');
        return;
    }
    if (!confirm(`آیا از حذف کامل کاربر "${username}" مطمئن هستید؟`)) return;

    try {
        const data = await getData();
        let users = data.users || [];
        let messages = data.messages || [];
        let admins = data.admins || [];
        let timedOut = data.timedOut || [];

        users = users.filter(u => u.username !== username);
        messages = messages.filter(m => m.username !== username);
        admins = admins.filter(a => a !== username);
        timedOut = timedOut.filter(t => t !== username);

        const result = await updateData({ ...data, users, messages, admins, timedOut });

        if (!result) {
            alert('❌ خطا در حذف کاربر!');
            return;
        }

        await loadAdminUsers();
        if (chatSection.classList.contains('active')) {
            await loadChatUsers();
            await loadMessages();
        }

        alert(`✅ کاربر "${username}" به طور کامل از دیتابیس حذف شد!`);
    } catch (e) {
        console.error('❌ خطا:', e);
        alert('❌ خطا در حذف کاربر!');
    }
};

window.makeAdmin = async function(username) {
    if (currentUser.username !== 'ArshiaT') {
        alert('❌ فقط مدیر اصلی می‌تواند ادمین تعیین کند!');
        return;
    }
    if (!confirm(`آیا می‌خواهید "${username}" را ادمین کنید؟`)) return;
    
    const data = await getData();
    const admins = data.admins || [];
    if (!admins.includes(username)) {
        admins.push(username);
        await updateData({ ...data, admins });
    }
    loadAdminUsers();
    if (chatSection.classList.contains('active')) loadChatUsers();
    alert(`✅ "${username}" به لیست ادمین‌ها اضافه شد!`);
};

window.removeAdmin = async function(username) {
    if (currentUser.username !== 'ArshiaT') {
        alert('❌ فقط مدیر اصلی می‌تواند ادمین را حذف کند!');
        return;
    }
    if (!confirm(`آیا می‌خواهید ادمین بودن "${username}" را لغو کنید؟`)) return;
    
    const data = await getData();
    let admins = data.admins || [];
    admins = admins.filter(a => a !== username);
    await updateData({ ...data, admins });
    loadAdminUsers();
    if (chatSection.classList.contains('active')) loadChatUsers();
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
    clearSession();
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
    const data = await getData();
    const usersList = data.users || [];

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

    const idx = usersList.findIndex(u => u.email === currentUser.email);
    if (idx !== -1) {
        usersList[idx].username = newUsername;
        if (newPassword) usersList[idx].password = newPassword;
        usersList[idx].country = newCountry;
    }

    const admins = data.admins || [];
    const adminIdx = admins.indexOf(currentUser.username);
    if (adminIdx !== -1) {
        admins[adminIdx] = newUsername;
    }

    await updateData({ ...data, users: usersList, admins });

    const updatedUser = { ...currentUser, username: newUsername, country: newCountry };
    if (newPassword) updatedUser.password = newPassword;
    currentUser = updatedUser;
    saveSession(newUsername);

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
async function init() {
    await loadTheme();

    const sessionUsername = getSession();
    if (sessionUsername) {
        const data = await getData();
        const users = data.users || [];
        const found = users.find(u => u.username === sessionUsername);
        if (found) {
            currentUser = found;
            const updatedUsers = users.map(u => u.username === found.username ? { ...u, online: true } : u);
            await updateData({ ...data, users: updatedUsers });
        } else {
            clearSession();
        }
    }

    updateUIForUser();
    showSection('home');

    // ===== چک کردن خودکار وجود کاربر هر ۳ ثانیه =====
    checkInterval = setInterval(checkUserExists, 3000);

    console.log('🔥 JSONBin Chat is ready! (بدون localStorage)');
    console.log('👤 کاربر فعلی:', currentUser ? currentUser.username : 'خیر');
}

init();

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSettings();
        $('logoutOverlay').classList.remove('active');
    }
});
