// ============================================================
// CHAT - منطق چت روم
// ============================================================

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
    initNavbar();
    initChatSystem();

    // ============================================================
    // چک کردن پارامتر URL قبل از هر کاری (بدون پرش)
    // ============================================================
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminMode = urlParams.get('admin') === 'true' && currentUser.username === OWNER_USERNAME;

    if (isAdminMode) {
        // ===== حالت پنل مدیریت =====
        console.log('🛡️ حالت پنل مدیریت (بدون پرش)');

        const chatSection = $('chatSection');
        const adminPanel = $('adminPanel');

        // چت رو مخفی کن
        if (chatSection) chatSection.classList.remove('active');

        // پنل مدیریت رو نشون بده
        if (adminPanel) adminPanel.classList.add('active');

        // لیست کاربران رو لود کن
        loadAdminUsers();

    } else {
        // ===== حالت چت روم =====
        console.log('💬 حالت چت روم');

        loadChatUsers();
        loadMessages();
        startIntervals();
    }

    // ===== چک خودکار وجود کاربر =====
    checkInterval = setInterval(checkUserExists, 3000);

    console.log('🔥 Chat page is ready!');
}

// ============================================================
// NAVBAR
// ============================================================
function initNavbar() {
    // دکمه پنل کاربری → رفتن به panel.html
    const userBtnNav = $('userBtnNav');
    if (userBtnNav) {
        userBtnNav.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('👤 رفتن به پنل کاربری');
            window.location.href = 'panel.html';
        });
    }

    // دکمه چت روم → رفرش صفحه (حالت چت)
    const chatBtnNav = $('chatBtnNav');
    if (chatBtnNav) {
        chatBtnNav.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('💬 رفتن به چت روم');
            window.location.href = 'chat.html';
        });
    }

    // دکمه تم
    const themeToggleNav = $('themeToggleNav');
    if (themeToggleNav) {
        themeToggleNav.addEventListener('click', function(e) {
            e.preventDefault();
            toggleTheme();
        });
    }
}

// ============================================================
// CHAT SYSTEM
// ============================================================
function initChatSystem() {
    const sendChatBtn = $('sendChatBtn');
    const chatInput = $('chatInput');

    if (sendChatBtn) sendChatBtn.onclick = sendMessage;
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }
}

// ============================================================
// SEND MESSAGE
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

    // چک کردن وجود کاربر
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

// ============================================================
// LOAD MESSAGES
// ============================================================
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

// ============================================================
// LOAD CHAT USERS
// ============================================================
async function loadChatUsers() {
    if (!currentUser) return;

    const data = await getData();
    const users = data.users || [];
    const admins = data.admins || [];
    const container = $('usersListContainer');
    if (!container) return;

    // آپدیت آنلاین کاربر جاری
    const updatedUsers = users.map(u =>
        u.username === currentUser.username ? { ...u, online: true } : u
    );
    await updateData({ ...data, users: updatedUsers });

    const onlineList = updatedUsers.filter(u => u.online === true);
    const offlineList = updatedUsers.filter(u => u.online !== true);

    // مرتب‌سازی آنلاین‌ها
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
// AUTO LOGOUT - چک کردن وجود کاربر
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
        loadMessages();
    }, 5000);
    userInterval = setInterval(() => {
        loadChatUsers();
    }, 10000);
}

function stopIntervals() {
    if (chatInterval) clearInterval(chatInterval);
    if (userInterval) clearInterval(userInterval);
    chatInterval = null;
    userInterval = null;
}

// ============================================================
// DELETE MESSAGE (ادمین/مدیر)
// ============================================================
window.deleteMessage = async function(index) {
    if (!confirm('آیا از حذف این پیام مطمئن هستید؟')) return;
    const data = await getData();
    const messages = data.messages || [];
    messages.splice(index, 1);
    await updateData({ ...data, messages });
    loadMessages();
};

// ============================================================
// TIMEOUT USER (ادمین/مدیر)
// ============================================================
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
// START
// ============================================================
document.addEventListener('DOMContentLoaded', initChat);
