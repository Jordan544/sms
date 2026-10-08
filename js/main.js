/* ===== DASHBOARD MODULE ===== */

function loadDashboard() {
    const students = getStudents();

    // Stats
    const totalEl = document.getElementById('totalStudents');
    const activeEl = document.getElementById('activeStudents');
    const classesEl = document.getElementById('totalClasses');
    const newEl = document.getElementById('newThisMonth');

    if (totalEl) totalEl.textContent = students.length;
    if (activeEl) activeEl.textContent = students.filter(s => s.status === 'Active').length;
    if (classesEl) classesEl.textContent = new Set(students.map(s => s.class)).size;

    // New this month
    const now = new Date();
    const newThisMonth = students.filter(s => {
        const d = new Date(s.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    if (newEl) newEl.textContent = newThisMonth;

    // Recent activity
    renderActivities();
}

function renderActivities() {
    const list = document.getElementById('activityList');
    if (!list) return;

    let activities = [];
    try {
        activities = JSON.parse(localStorage.getItem('school_activities')) || [];
    } catch (e) {
        activities = [];
    }

    if (activities.length === 0) {
        list.innerHTML = `
            <li class="activity-item">
                <div class="activity-dot" style="background:#9e9e9e;"></div>
                <span class="activity-text">No recent activity yet.</span>
            </li>`;
        return;
    }

    list.innerHTML = activities.map(a => `
        <li class="activity-item">
            <div class="activity-dot"></div>
            <span class="activity-text">${a.text}</span>
            <span class="activity-time">${timeAgo(a.time)}</span>
        </li>
    `).join('');
}

function timeAgo(isoString) {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return new Date(isoString).toLocaleDateString();
}