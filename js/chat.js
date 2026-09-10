// ============================================================
// CHAT - منطق چت روم
// ============================================================

// ============================================================
// NAVIGATION - نسخه ساده و مطمئن
// ============================================================
function showChat() {
    console.log('💬 نمایش چت');
    const dashboardSection = $('dashboardSection');
    const chatSection = $('chatSection');
    const adminPanel = $('adminPanel');

    if (dashboardSection) dashboardSection.classList.remove('active');
    if (adminPanel) adminPanel.classList.remove('active');
    if (chatSection) chatSection.classList.add('active');

    loadChatUsers();
    loadMessages();
    startIntervals();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showDashboard() {
    console.log('👤 نمایش پنل کاربری');
    const dashboardSection = $('dashboardSection');
    const chatSection = $('chatSection');
    const adminPanel = $('adminPanel');

    if (chatSection) chatSection.classList.remove('active');
    if (adminPanel) adminPanel.classList.remove('active');
    if (dashboardSection) dashboardSection.classList.add('active');

    stopIntervals();
    updateDashboardUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showAdminPanel() {
    console.log('🛡️ نمایش پنل مدیریت');
    const dashboardSection = $('dashboardSection');
    const chatSection = $('chatSection');
    const adminPanel = $('adminPanel');

    if (chatSection) chatSection.classList.remove('active');
    if (dashboardSection) dashboardSection.classList.remove('active');
    if (adminPanel) adminPanel.classList.add('active');

    stopIntervals();
    loadAdminUsers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// برای سازگاری با کد قدیمی
function showSection(section) {
    if (section === 'chat') showChat();
    else if (section === 'dashboard') showDashboard();
    else if (section === 'admin') showAdminPanel();
}

// ============================================================
// NAVBAR - دکمه‌ها
// ============================================================
function initNavbar() {
    // دکمه پنل کاربری
    const userBtnNav = $('userBtnNav');
    if (userBtnNav) {
        userBtnNav.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            showDashboard();
        };
    }

    // دکمه چت روم
    const chatBtnNav = $('chatBtnNav');
    if (chatBtnNav) {
        chatBtnNav.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (!currentUser) {
                alert('لطفاً ابتدا وارد شوید!');
                window.location.href = 'index.html';
                return;
            }
            showChat();
        };
    }

    // دکمه تم
    const themeToggleNav = $('themeToggleNav');
    if (themeToggleNav) {
        themeToggleNav.onclick = function() {
            toggleTheme();
        };
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
    showDashboard();
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
    updateDashboardUI();
    initNavbar();
    initSettings();

    // دکمه‌های logout
    const logoutConfirmBtn = $('logoutConfirmBtn');
    const logoutCancelBtn = $('logoutCancelBtn');
    const logoutOverlay = $('logoutOverlay');

    if (logoutConfirmBtn) logoutConfirmBtn.onclick = handleLogout;
    if (logoutCancelBtn) logoutCancelBtn.onclick = () => {
        if (logoutOverlay) logoutOverlay.classList.remove('active');
    };
    if (logoutOverlay) {
        logoutOverlay.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('active');
        });
    }

    // دکمه ارسال پیام
    const sendChatBtn = $('sendChatBtn');
    const chatInput = $('chatInput');
    if (sendChatBtn) sendChatBtn.onclick = sendMessage;
    if (chatInput) {
        chatInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // ============================================================
    // نمایش پنل کاربری به صورت پیش‌فرض (نه چت)
    // ============================================================
    showDashboard();

    // چک خودکار
    checkInterval = setInterval(checkUserExists, 3000);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            window.closeSettings();
            if (logoutOverlay) logoutOverlay.classList.remove('active');
        }
    });

    console.log('🔥 Chat page is ready!');
}

document.addEventListener('DOMContentLoaded', initChat);
