// ============================================================
// API - ارتباط با JSONBin
// ============================================================

/**
 * دریافت همه دیتا از JSONBin
 * @returns {Promise<Object>} - { users, messages, admins, timedOut, theme }
 */
async function getData() {
    try {
        const res = await fetch(API_URL + '/latest', {
            headers: { 'X-Master-Key': MASTER_KEY }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        return data.record || {
            messages: [],
            users: [],
            admins: [],
            timedOut: [],
            theme: 'dark'
        };
    } catch (e) {
        console.error('❌ خطا در دریافت:', e);
        return {
            messages: [],
            users: [],
            admins: [],
            timedOut: [],
            theme: 'dark'
        };
    }
}

/**
 * آپدیت کل دیتا در JSONBin
 * @param {Object} data - دیتای کامل
 * @returns {Promise<Object|null>}
 */
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
// SESSION MANAGEMENT (فقط برای لاگین - در sessionStorage)
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
// THEME FUNCTIONS (مشترک بین صفحات)
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
    if (themeIconNav && themeLabelNav) {
        if (theme === 'light') {
            themeIconNav.textContent = '☀️';
            themeLabelNav.textContent = 'روشن';
        } else {
            themeIconNav.textContent = '🌙';
            themeLabelNav.textContent = 'تاریک';
        }
    }
}

async function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    
    const data = await getData();
    data.theme = nextTheme;
    await updateData(data);
}

// ============================================================
// USER UPDATE HELPERS
// ============================================================

/**
 * آپدیت وضعیت آنلاین کاربر
 */
async function setUserOnline(username, online = true) {
    const data = await getData();
    const users = data.users || [];
    const updatedUsers = users.map(u => 
        u.username === username ? { ...u, online } : u
    );
    await updateData({ ...data, users: updatedUsers });
}

/**
 * خروج کاربر (آفلاین کردن)
 */
async function logoutUser() {
    if (currentUser) {
        await setUserOnline(currentUser.username, false);
    }
    
    if (chatInterval) clearInterval(chatInterval);
    if (userInterval) clearInterval(userInterval);
    if (checkInterval) clearInterval(checkInterval);
    
    currentUser = null;
    clearSession();
    updateUIForUser();
}
