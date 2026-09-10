// ============================================================
// ADMIN - پنل مدیریت
// ============================================================

// ============================================================
// OPEN ADMIN PANEL
// ============================================================
window.openAdminPanel = function() {
    if (!currentUser || currentUser.username !== OWNER_USERNAME) {
        alert('شما دسترسی مدیر ندارید!');
        return;
    }

    console.log('🛡️ باز کردن پنل مدیریت');

    const chatSection = $('chatSection');
    const adminPanel = $('adminPanel');

    if (chatSection) chatSection.classList.remove('active');
    if (adminPanel) adminPanel.classList.add('active');

    stopIntervals();
    loadAdminUsers();

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ============================================================
// CLOSE ADMIN PANEL
// ============================================================
window.closeAdminPanel = function() {
    console.log('🔙 بستن پنل مدیریت');

    const chatSection = $('chatSection');
    const adminPanel = $('adminPanel');

    if (adminPanel) adminPanel.classList.remove('active');
    if (chatSection) chatSection.classList.add('active');

    startIntervals();
    loadChatUsers();
    loadMessages();
};

// ============================================================
// LOAD ADMIN USERS
// ============================================================
async function loadAdminUsers() {
    const data = await getData();
    const users = data.users || [];
    const admins = data.admins || [];
    const container = $('adminUsersList');
    if (!container) return;

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
        const isOwnerUser = u.username === OWNER_USERNAME;
        const isAdminUser = admins.includes(u.username);
        const isCurrentUser = u.username === currentUser.username;

        let roleLabel = 'کاربر',
            roleClass = 'user';
        if (isOwnerUser) {
            roleLabel = 'مدیر';
            roleClass = 'owner';
        } else if (isAdminUser) {
            roleLabel = 'ادمین';
            roleClass = 'admin';
        }

        const canDelete = currentUser.username === OWNER_USERNAME && !isOwnerUser && !isCurrentUser;

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
// DELETE USER
// ============================================================
window.deleteUser = async function(username) {
    if (currentUser.username !== OWNER_USERNAME) {
        alert('❌ فقط مدیر اصلی می‌تواند کاربران را حذف کند!');
        return;
    }
    if (username === currentUser.username) {
        alert('❌ نمی‌توانید خودتان را حذف کنید!');
        return;
    }
    if (username === OWNER_USERNAME) {
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

        alert(`✅ کاربر "${username}" به طور کامل حذف شد!`);
    } catch (e) {
        console.error('❌ خطا:', e);
        alert('❌ خطا در حذف کاربر!');
    }
};

// ============================================================
// MAKE ADMIN
// ============================================================
window.makeAdmin = async function(username) {
    if (currentUser.username !== OWNER_USERNAME) {
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
    alert(`✅ "${username}" به لیست ادمین‌ها اضافه شد!`);
};

// ============================================================
// REMOVE ADMIN
// ============================================================
window.removeAdmin = async function(username) {
    if (currentUser.username !== OWNER_USERNAME) {
        alert('❌ فقط مدیر اصلی می‌تواند ادمین را حذف کند!');
        return;
    }
    if (!confirm(`آیا می‌خواهید ادمین بودن "${username}" را لغو کنید؟`)) return;

    const data = await getData();
    let admins = data.admins || [];
    admins = admins.filter(a => a !== username);
    await updateData({ ...data, admins });
    loadAdminUsers();
    alert(`✅ ادمین بودن "${username}" لغو شد!`);
};
