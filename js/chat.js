// ============================================================
// CHAT - منطق چت روم
// ============================================================

// ============================================================
// NAVIGATION
// ============================================================
function showSection(section) {
    console.log('📄 showSection:', section);

    const dashboardSection = $('dashboardSection');
    const chatSection = $('chatSection');
    const adminPanel = $('adminPanel');

    if (!dashboardSection || !chatSection || !adminPanel) {
        console.error('❌ یکی از بخش‌ها پیدا نشد!');
        return;
    }

    // حذف active از همه
    dashboardSection.classList.remove('active');
    chatSection.classList.remove('active');
    adminPanel.classList.remove('active');

    // اضافه کردن active به بخش موردنظر
    if (section === 'dashboard') {
        dashboardSection.classList.add('active');
        updateDashboardUI();
    } else if (section === 'chat') {
        chatSection.classList.add('active');
        loadChatUsers();
        loadMessages();
        startIntervals();
    } else if (section === 'admin') {
        adminPanel.classList.add('active');
        loadAdminUsers();
    }
}

// ============================================================
// NAVBAR
// ============================================================
function initNavbar() {
    // دکمه پنل کاربری → میره به پنل
    const userBtnNav = $('userBtnNav');
    if (userBtnNav) {
        // حذف لیسنرهای قبلی
        userBtnNav.replaceWith(userBtnNav.cloneNode(true));
        const newUserBtn = $('userBtnNav');
        newUserBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('👤 کلیک روی پنل کاربری');
            showSection('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // دکمه چت روم → میره به چت
    const chatBtnNav = $('chatBtnNav');
    if (chatBtnNav) {
        // حذف لیسنرهای قبلی
        chatBtnNav.replaceWith(chatBtnNav.cloneNode(true));
        const newChatBtn = $('chatBtnNav');
        newChatBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('💬 کلیک روی چت روم');
            if (!currentUser) {
                alert('لطفاً ابتدا وارد شوید!');
                window.location.href = 'index.html';
                return;
            }
            showSection('chat');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // دکمه تم
    const themeToggleNav = $('themeToggleNav');
    if (themeToggleNav) {
        themeToggleNav.replaceWith(themeToggleNav.cloneNode(true));
        const newThemeBtn = $('themeToggleNav');
        newThemeBtn.addEventListener('click', toggleTheme);
    }
}

// ============================================================
// DASHBOARD UI
// ============================================================
function updateDashboardUI() {
    if (!currentUser) return;

    const dashboardUsername = $('dashboardUsername');
    const countryBadge = $('countryBadge');
    const countryFlag = $('countryFlag');
    const dashboardBg = $('dashboardBg');

    if (dashboardUsername) dashboardUsername.textContent = currentUser.username;

    const country = currentUser.country;
    if (countryBadge) countryBadge.textContent = `🎖️ کشور مورد علاقه: ${country}`;
    if (countryFlag) countryFlag.src = `images/${flagMap[country] || 'germany-flag.png'}`;
    if (dashboardBg) dashboardBg.style.backgroundImage = `url('images/${bgMap[country] || 'germany-bg.jpg'}')`;

    const adminPanelBtn = $('adminPanelBtn');
    if (adminPanelBtn) {
        adminPanelBtn.style.display = currentUser.username === OWNER_USERNAME ? 'block' : 'none';
    }
}

// ============================================================
// CHAT SYSTEM
// ============================================================
async function sendMessage() {
    const input = $('chatInput');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;
    if (!currentUser) {
        alert('لطفاً ابتدا وارد شوید!');
        return;
    }

    const data = await getData();
    const users = data.users || [];
    if (!users.some(u => u.username === currentUser.username)) {
        alert('⚠️ اکانت شما حذف شده است!');
        handleDeletedAccount();
        return;
    }

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
    if (!container) return;

    if (messages.length === 0) {
        container.innerHTML =
            '<div style="text-align:center; color:var(--text-secondary); padding:40px 0;">هنوز پیامی ارسال نشده است</div>';
        return;
    }

    const admins = data.admins || [];
    let html = '';

    messages.forEach((msg, index) => {
        const isOwn = currentUser && msg.username === currentUser.username;
        const canModerate = currentUser &&
            (currentUser.username === OWNER_USERNAME || admins.includes(currentUser.username));

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
    const admins = data.admins || [];
    const container = $('usersListContainer');
    if (!container) return;

    const updatedUsers = users.map(u =>
        u.username === currentUser.username ? { ...u, online: true } : u
    );
    await updateData({ ...data, users: updatedUsers });

    const onlineList = updatedUsers.filter(u => u.online === true);
    const offlineList = updatedUsers.filter(u => u.online !== true);

    onlineList.sort((a, b) => {
        const roleA = a.username === OWNER_USERNAME ? 'owner' : (admins.includes(a.username) ? 'admin' : 'user');
        const roleB = b.username === OWNER_USERNAME ? 'owner' : (admins.includes(b.username) ? 'admin' : 'user');
        if (roleA === 'owner') return -1;
        if (roleB === 'owner') return 1;
        if (roleA === 'admin' && roleB !== 'admin') return -1;
        if (roleB === 'admin' && roleA !== 'admin') return 1;
        return 0;
    });

    let html = '';

    if (onlineList.length > 0) {
        onlineList.forEach(u => {
            const role = u.username === OWNER_USERNAME ? 'owner' : (admins.includes(u.username) ? 'admin' : 'user');
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
            const role = u.username === OWNER_USERNAME ? 'owner' : (admins.includes(u.username) ? 'admin' : 'user');
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
// AUTO LOGOUT
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
    if (chatInterval) clearInterval(chatInterval);
    if (userInterval) clearInterval(userInterval);
    if (checkInterval) clearInterval(checkInterval);

    currentUser = null;
    clearSession();

    alert('⚠️ اکانت شما توسط مدیر حذف شده است!');
    window.location.href = 'index.html';
}

// ============================================================
// INTERVALS
// ============================================================
function startIntervals() {
    stopIntervals();
    chatInterval = setInterval(() => {
        const chatSection = $('chatSection');
        if (chatSection && chatSection.classList.contains('active')) loadMessages();
    }, 5000);
    userInterval = setInterval(() => {
        const chatSection = $('chatSection');
        if (chatSection && chatSection.classList.contains('active')) loadChatUsers();
    }, 10000);
}

function stopIntervals() {
    if (chatInterval) clearInterval(chatInterval);
    if (userInterval) clearInterval(userInterval);
    chatInterval = null;
    userInterval = null;
}

// ============================================================
// CHAT ACTIONS
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

window.closeChat = async function() {
    if (currentUser) {
        await setUserOnline(currentUser.username, false);
    }
    stopIntervals();
    showSection('dashboard');
};

// ============================================================
// LOGOUT
// ============================================================
async function handleLogout() {
    await logoutUser();
    const logoutOverlay = $('logoutOverlay');
    if (logoutOverlay) logoutOverlay.classList.remove('active');
    alert('✅ شما با موفقیت خارج شدید!');
    window.location.href = 'index.html';
}

window.openLogout = function() {
    if (!currentUser) {
        alert('لطفاً ابتدا وارد شوید!');
        return;
    }
    const logoutOverlay = $('logoutOverlay');
    if (logoutOverlay) logoutOverlay.classList.add('active');
};

// ============================================================
// SETTINGS
// ============================================================
window.openSettings = function() {
    if (!currentUser) {
        alert('لطفاً ابتدا وارد شوید!');
        return;
    }
    const settingsOverlay = $('settingsOverlay');
    const settingsPanel = $('settingsPanel');
    const settingsUsername = $('settingsUsername');
    const settingsCountry = $('settingsCountry');
    const settingsPassword = $('settingsPassword');

    if (settingsOverlay) settingsOverlay.classList.add('active');
    if (settingsPanel) settingsPanel.classList.add('active');

    if (settingsUsername) settingsUsername.value = currentUser.username;
    if (settingsCountry) settingsCountry.value = currentUser.country;
    if (settingsPassword) settingsPassword.value = '';

    ['settingsSuccess', 'settingsError', 'settingsUsernameError', 'settingsPasswordError'].forEach(id => {
        const el = $(id);
        if (el) el.classList.remove('show');
    });
};

window.closeSettings = function() {
    const settingsOverlay = $('settingsOverlay');
    const settingsPanel = $('settingsPanel');
    if (settingsOverlay) settingsOverlay.classList.remove('active');
    if (settingsPanel) settingsPanel.classList.remove('active');
};

// ============================================================
// INIT CHAT PAGE
// ============================================================
async function initChat() {
    console.log('🚀 شروع initChat');

    // لود تم
    await loadTheme();

    // چک سشن
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

    // آپدیت UI
    updateUIForUser();
    updateDashboardUI();

    // راه‌اندازی ناوبار (با لیسنرهای جدید)
    initNavbar();

    // راه‌اندازی تنظیمات
    initSettings();

    // رویداد دکمه‌های logout
    const logoutConfirmBtn = $('logoutConfirmBtn');
    const logoutCancelBtn = $('logoutCancelBtn');
    const logoutOverlay = $('logoutOverlay');

    if (logoutConfirmBtn) {
        logoutConfirmBtn.replaceWith(logoutConfirmBtn.cloneNode(true));
        $('logoutConfirmBtn').addEventListener('click', handleLogout);
    }
    if (logoutCancelBtn) {
        logoutCancelBtn.replaceWith(logoutCancelBtn.cloneNode(true));
        $('logoutCancelBtn').addEventListener('click', () => {
            if (logoutOverlay) logoutOverlay.classList.remove('active');
        });
    }
    if (logoutOverlay) {
        logoutOverlay.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('active');
        });
    }

    // دکمه ارسال پیام
    const sendChatBtn = $('sendChatBtn');
    const chatInput = $('chatInput');
    if (sendChatBtn) {
        sendChatBtn.replaceWith(sendChatBtn.cloneNode(true));
        $('sendChatBtn').addEventListener('click', sendMessage);
    }
    if (chatInput) {
        chatInput.replaceWith(chatInput.cloneNode(true));
        $('chatInput').addEventListener('keypress', e => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // ===== نمایش چت روم به صورت پیش‌فرض =====
    console.log('💬 نمایش چت روم');
    showSection('chat');

    // چک کردن خودکار وجود کاربر هر ۳ ثانیه
    checkInterval = setInterval(checkUserExists, 3000);

    // Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            window.closeSettings();
            if (logoutOverlay) logoutOverlay.classList.remove('active');
        }
    });

    console.log('🔥 Chat page is ready!');
}

document.addEventListener('DOMContentLoaded', initChat);
