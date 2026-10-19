seedData();
const session = getSession();
if (!session) location.replace('index.html');

const isAdmin = session.role === 'admin';
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);

/* ---------- Navigation ---------- */
const VIEWS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge', roles: ['admin', 'teacher'] },
    { id: 'students', label: 'Students', icon: 'fa-user-graduate', roles: ['admin', 'teacher'] },
    { id: 'teachers', label: 'Teachers', icon: 'fa-chalkboard-user', roles: ['admin'] },
    { id: 'attendance', label: 'Attendance', icon: 'fa-clipboard-check', roles: ['admin', 'teacher'] },
    { id: 'grades', label: 'Grades', icon: 'fa-square-poll-vertical', roles: ['admin', 'teacher'] },
    { id: 'announcements', label: 'Announcements', icon: 'fa-bullhorn', roles: ['admin', 'teacher'] }
];
let current = 'dashboard';

function buildNav() {
    $('#nav').innerHTML = VIEWS.filter(v => v.roles.includes(session.role)).map(v =>
        `<button class="nav-item ${v.id === current ? 'active' : ''}" data-view="${v.id}">
            <i class="fa-solid ${v.icon}"></i> ${v.label}</button>`).join('');
    $('#nav').querySelectorAll('.nav-item').forEach(b => b.onclick = () => go(b.dataset.view));
}

function go(id) {
    current = id;
    buildNav();
    $('#pageTitle').textContent = VIEWS.find(v => v.id === id).label;
    ({ dashboard, students, teachers, attendance, grades, announcements })[id]();
}

/* ---------- UI helpers ---------- */
function toast(msg, type) {
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
}

function openModal(title, bodyHtml, opts) {
    opts = opts || {};
    closeModal();
    const m = document.createElement('div');
    m.className = 'modal-backdrop';
    m.id = 'modal';
    m.innerHTML = `<div class="modal" style="${opts.wide ? 'max-width:720px' : ''}">
        <div class="modal-head"><strong>${esc(title)}</strong>
            <button class="btn-icon" id="modalX"><i class="fa-solid fa-xmark"></i></button></div>
        <form id="modalForm" novalidate>
            <div class="modal-body">${bodyHtml}</div>
            <div class="modal-foot">
                <button type="button" class="btn btn-secondary" id="modalCancel">${opts.onSubmit ? 'Cancel' : 'Close'}</button>
                ${opts.onSubmit ? `<button type="submit" class="btn btn-primary">${esc(opts.submitLabel || 'Save')}</button>` : ''}
                ${opts.extra || ''}
            </div>
        </form></div>`;
    document.body.appendChild(m);
    $('#modalX').onclick = $('#modalCancel').onclick = closeModal;
    m.addEventListener('mousedown', e => { if (e.target === m) closeModal(); });
    $('#modalForm').onsubmit = e => {
        e.preventDefault();
        if (opts.onSubmit) opts.onSubmit(new FormData(e.target));
    };
}
function closeModal() { const m = $('#modal'); if (m) m.remove(); }

function field(label, name, value, opts) {
    opts = opts || {};
    const v = esc(value);
    let input;
    if (opts.options) {
        input = `<select name="${name}">${opts.options.map(o =>
            `<option value="${esc(o)}" ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    } else if (opts.textarea) {
        input = `<textarea name="${name}" rows="4">${v}</textarea>`;
    } else {
        input = `<input name="${name}" type="${opts.type || 'text'}" value="${v}" ${opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : ''}>`;
    }
    return `<div class="form-group"><label>${esc(label)}</label>${input}</div>`;
}

function download(filename, text, mime) {
    const blob = new Blob(['\ufeff' + text], { type: mime || 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function csvCell(v) {
    let s = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; 
    return '"' + s.replace(/"/g, '""') + '"';
}
function toCSV(headers, rows) {
    return [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n');
}

function letter(score) {
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}

const getStudents = () => DB.get('students', []);
const getUsers = () => DB.get('users', []);

/* ================= DASHBOARD ================= */
function dashboard() {
    const students = getStudents();
    const teachers = getUsers().filter(u => u.role === 'teacher');
    const att = DB.get('attendance', {});
    const grades = DB.get('grades', {});

    let marked = 0, present = 0;
    Object.keys(att).filter(k => k.startsWith(today() + '|')).forEach(k => {
        Object.values(att[k]).forEach(s => { marked++; if (s !== 'A') present++; });
    });
    const attRate = marked ? Math.round(present / marked * 100) + '%' : 'N/A';

    const scores = Object.values(grades).map(Number).filter(n => !isNaN(n));
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';

    const counts = CLASSES.map(c => [c, students.filter(s => s.className === c).length]);
    const max = Math.max(1, ...counts.map(c => c[1]));
    const latest = DB.get('announcements', []).slice(0, 3);

    $('#view').innerHTML = `
        <div class="stats">
            ${statCard('fa-user-graduate', 'blue', students.length, 'Students')}
            ${statCard('fa-chalkboard-user', 'green', teachers.length, 'Teachers')}
            ${statCard('fa-clipboard-check', 'amber', attRate, "Today's attendance")}
            ${statCard('fa-chart-line', 'purple', avg, 'Average score')}
        </div>
        <div class="two-col">
            <div class="card"><h3>Students per class</h3>
                ${counts.map(([c, n]) => `<div class="bar-row"><span>${esc(c)}</span>
                    <div class="bar-track"><div class="bar-fill" style="width:${n / max * 100}\%"></div></div><strong>${n}</strong></div>`).join('')}
            </div>
            <div class="card"><h3>Latest announcements</h3>
                ${latest.length ? latest.map(announcementHtml).join('') : '<p class="empty">No announcements yet.</p>'}
            </div>
        </div>`;
}
function statCard(icon, color, value, label) {
    return `<div class="stat"><div class="stat-icon ${color}"><i class="fa-solid ${icon}"></i></div>
        <div><div class="stat-value">${esc(value)}</div><div class="stat-label">${esc(label)}</div></div></div>`;
}

/* ================= STUDENTS ================= */
const sState = { q: '', cls: '', status: '', sort: 'name', dir: 1, page: 1, perPage: 8 };

function filteredStudents() {
    const q = sState.q.toLowerCase();
    return getStudents()
        .filter(s => (!sState.cls || s.className === sState.cls) && (!sState.status || s.status === sState.status) &&
            (!q || [s.name, s.email, s.id, s.guardian].some(v => String(v).toLowerCase().includes(q))))
        .sort((a, b) => String(a[sState.sort]).localeCompare(String(b[sState.sort])) * sState.dir);
}

function students() {
    $('#view').innerHTML = `
        <div class="card">
            <div class="card-head"><h3>Student records</h3>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-secondary" id="exportBtn"><i class="fa-solid fa-file-csv"></i> Export CSV</button>
                    ${isAdmin ? '<button class="btn btn-primary" id="addBtn"><i class="fa-solid fa-plus"></i> Add Student</button>' : ''}
                </div>
            </div>
            <div class="toolbar">
                <input id="sSearch" placeholder="Search name, email, ID or guardian..." value="${esc(sState.q)}">
                <select id="sClass"><option value="">All classes</option>${CLASSES.map(c => `<option ${c === sState.cls ? 'selected' : ''}>${c}</option>`).join('')}</select>
                <select id="sStatus"><option value="">All statuses</option>${['Active', 'Inactive'].map(c => `<option ${c === sState.status ? 'selected' : ''}>${c}</option>`).join('')}</select>
            </div>
            <div id="studentTable"></div>
        </div>`;

    $('#sSearch').oninput = e => { sState.q = e.target.value; sState.page = 1; drawStudents(); };
    $('#sClass').onchange = e => { sState.cls = e.target.value; sState.page = 1; drawStudents(); };
    $('#sStatus').onchange = e => { sState.status = e.target.value; sState.page = 1; drawStudents(); };
    $('#exportBtn').onclick = exportStudents;
    if (isAdmin) $('#addBtn').onclick = () => studentForm();
    drawStudents();
}

function drawStudents() {
    const list = filteredStudents();
    const pages = Math.max(1, Math.ceil(list.length / sState.perPage));
    if (sState.page > pages) sState.page = pages;
    const slice = list.slice((sState.page - 1) * sState.perPage, sState.page * sState.perPage);
    const th = (key, label) => `<th class="sortable" data-sort="${key}">${label}${sState.sort === key ? (sState.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`;

    $('#studentTable').innerHTML = `
        <div class="table-wrap"><table>
            <thead><tr>${th('id', 'ID')}${th('name', 'Name')}${th('className', 'Class')}${th('gender', 'Gender')}<th>Guardian</th><th>Phone</th>${th('status', 'Status')}<th>Actions</th></tr></thead>
            <tbody>${slice.length ? slice.map(s => `<tr>
                <td>${esc(s.id)}</td><td><strong>${esc(s.name)}</strong><br><small style="color:var(--muted)">${esc(s.email)}</small></td>
                <td>${esc(s.className)}</td><td>${esc(s.gender)}</td><td>${esc(s.guardian)}</td><td>${esc(s.phone)}</td>
                <td><span class="badge ${s.status === 'Active' ? 'green' : 'gray'}">${esc(s.status)}</span></td>
                <td><div class="actions">
                    <button class="btn-icon" title="Report card" data-act="report" data-id="${esc(s.id)}"><i class="fa-solid fa-file-lines"></i></button>
                    ${isAdmin ? `<button class="btn-icon" title="Edit" data-act="edit" data-id="${esc(s.id)}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon danger" title="Delete" data-act="del" data-id="${esc(s.id)}"><i class="fa-solid fa-trash"></i></button>` : ''}
                </div></td></tr>`).join('') : '<tr><td colspan="8" class="empty">No students found.</td></tr>'}</tbody>
        </table></div>
        <div class="pagination"><span>${list.length} student${list.length === 1 ? '' : 's'}</span>
            <div class="pager"><button class="btn btn-secondary btn-sm" id="prevP" ${sState.page <= 1 ? 'disabled' : ''}>Prev</button>
            <span style="align-self:center">Page ${sState.page} of ${pages}</span>
            <button class="btn btn-secondary btn-sm" id="nextP" ${sState.page >= pages ? 'disabled' : ''}>Next</button></div></div>`;

    $('#studentTable').querySelectorAll('th.sortable').forEach(h => h.onclick = () => {
        sState.dir = sState.sort === h.dataset.sort ? -sState.dir : 1;
        sState.sort = h.dataset.sort;
        drawStudents();
    });
    $('#prevP').onclick = () => { sState.page--; drawStudents(); };
    $('#nextP').onclick = () => { sState.page++; drawStudents(); };
    $('#studentTable').querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
        const id = b.dataset.id;
        if (b.dataset.act === 'edit') studentForm(getStudents().find(s => s.id === id));
        if (b.dataset.act === 'report') reportCard(id);
        if (b.dataset.act === 'del') deleteStudent(id);
    });
}

function exportStudents() {
    const list = filteredStudents();
    if (!list.length) return toast('Nothing to export.', 'error');
    const headers = ['Student ID', 'Name', 'Email', 'Class', 'Gender', 'Date of Birth', 'Guardian', 'Phone', 'Status'];
    const rows = list.map(s => [s.id, s.name, s.email, s.className, s.gender, s.dob, s.guardian, s.phone, s.status]);
    download(`students-${today()}.csv`, toCSV(headers, rows));
    toast(`Exported ${list.length} student record${list.length === 1 ? '' : 's'}.`);
}

function studentForm(s) {
    const editing = !!s;
    s = s || { name: '', email: '', className: CLASSES[0], gender: 'Female', dob: '', guardian: '', phone: '', status: 'Active' };
    openModal(editing ? 'Edit student' : 'Add student', `
        <div class="form-grid">
            ${field('Full name', 'name', s.name)}${field('Email', 'email', s.email, { type: 'email' })}
            ${field('Class', 'className', s.className, { options: CLASSES })}${field('Gender', 'gender', s.gender, { options: ['Female', 'Male', 'Other'] })}
            ${field('Date of birth', 'dob', s.dob, { type: 'date' })}${field('Status', 'status', s.status, { options: ['Active', 'Inactive'] })}
            ${field('Guardian', 'guardian', s.guardian)}${field('Phone', 'phone', s.phone)}
        </div><div class="alert alert-error" id="formErr"></div>`, {
        onSubmit(fd) {
            const data = Object.fromEntries(fd);
            data.name = data.name.trim();
            data.email = data.email.trim();
            const err = !data.name ? 'Name is required.' :
                (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) ? 'Enter a valid email address.' : '';
            if (err) { $('#formErr').textContent = err; $('#formErr').classList.add('show'); return; }
            const all = getStudents();
            if (editing) {
                Object.assign(all.find(x => x.id === s.id), data);
            } else {
                const n = all.reduce((m, x) => Math.max(m, parseInt(String(x.id).replace(/\D/g, '')) || 1000), 1000) + 1;
                all.push({ id: 'S' + n, ...data });
            }
            DB.set('students', all);
            closeModal();
            toast(editing ? 'Student updated.' : 'Student added.');
            drawStudents();
        }
    });
}

function deleteStudent(id) {
    const s = getStudents().find(x => x.id === id);
    if (!s || !confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    DB.set('students', getStudents().filter(x => x.id !== id));
    toast('Student deleted.');
    drawStudents();
}

/* ================= TEACHERS (admin) ================= */
function teachers() {
    if (!isAdmin) return go('dashboard');
    const list = getUsers().filter(u => u.role === 'teacher');
    $('#view').innerHTML = `
        <div class="card">
            <div class="card-head"><h3>Teacher accounts</h3>
                <button class="btn btn-primary" id="addT"><i class="fa-solid fa-plus"></i> Add Teacher</button></div>
            <div class="table-wrap"><table>
                <thead><tr><th>Name</th><th>Email</th><th>Subjects</th><th>Classes</th><th>Actions</th></tr></thead>
                <tbody>${list.length ? list.map(t => {
                    const subs = Array.isArray(t.subjects) ? t.subjects.join(', ') : (t.subject || 'None');
                    const clss = Array.isArray(t.classes) ? t.classes.join(', ') : (t.className || 'None');
                    return `<tr>
                        <td><strong>${esc(t.name)}</strong></td><td>${esc(t.email)}</td><td>${esc(subs)}</td><td>${esc(clss)}</td>
                        <td><div class="actions">
                            <button class="btn-icon" data-act="edit" data-id="${esc(t.id)}"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-icon danger" data-act="del" data-id="${esc(t.id)}"><i class="fa-solid fa-trash"></i></button>
                        </div></td></tr>`;
                }).join('') : '<tr><td colspan="5" class="empty">No teachers yet.</td></tr>'}</tbody>
            </table></div></div>`;
    $('#addT').onclick = () => teacherForm();
    $('#view').querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
        const t = getUsers().find(u => u.id === b.dataset.id);
        if (b.dataset.act === 'edit') teacherForm(t);
        else if (confirm(`Delete teacher account for ${t.name}?`)) {
            DB.set('users', getUsers().filter(u => u.id !== t.id));
            toast('Teacher deleted.');
            teachers();
        }
    });
}

function teacherForm(t) {
    const editing = !!t;
    t = t || { name: '', email: '', password: '', subjects: [SUBJECTS[0]], classes: [CLASSES[0]] };
    const currentSubjects = Array.isArray(t.subjects) ? t.subjects : (t.subject ? [t.subject] : []);
    const currentClasses = Array.isArray(t.classes) ? t.classes : (t.className ? [t.className] : []);

    openModal(editing ? 'Edit teacher' : 'Add teacher', `
        <div class="form-grid">
            ${field('Full name', 'name', t.name)}
            ${field('Email (login)', 'email', t.email, { type: 'email' })}
        </div>
        <div class="form-group">
            <label>Subjects (Select all that apply)</label>
            <div class="selection-grid">
                ${SUBJECTS.map(sub => `
                    <label class="selection-card">
                        <input type="checkbox" name="subjects" value="${esc(sub)}" ${currentSubjects.includes(sub) ? 'checked' : ''}> 
                        <span>${esc(sub)}</span>
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="form-group">
            <label>Classes (Select all that apply)</label>
            <div class="selection-grid">
                ${CLASSES.map(cls => `
                    <label class="selection-card">
                        <input type="checkbox" name="classes" value="${esc(cls)}" ${currentClasses.includes(cls) ? 'checked' : ''}> 
                        <span>${esc(cls)}</span>
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="form-group">
            ${field(editing ? 'New password (leave blank to keep)' : 'Password', 'password', '', { type: 'password' })}
        </div>
        <div class="alert alert-error" id="formErr"></div>`, {
        onSubmit(fd) {
            const d = Object.fromEntries(fd);
            d.name = (d.name || '').trim();
            d.email = (d.email || '').trim().toLowerCase();
            
            const selectedSubjects = Array.from(document.querySelectorAll('input[name="subjects"]:checked')).map(cb => cb.value);
            const selectedClasses = Array.from(document.querySelectorAll('input[name="classes"]:checked')).map(cb => cb.value);

            const users = getUsers();
            const err = !d.name ? 'Name is required.' :
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) ? 'Enter a valid email address.' :
                users.some(u => u.email.toLowerCase() === d.email && u.id !== (t.id || '')) ? 'That email is already in use.' :
                (!editing && d.password.length < 6) || (d.password && d.password.length < 6) ? 'Password must be at least 6 characters.' : '';
            
            if (err) { $('#formErr').textContent = err; $('#formErr').classList.add('show'); return; }
            
            if (editing) {
                const u = users.find(x => x.id === t.id);
                Object.assign(u, { 
                    name: d.name, 
                    email: d.email, 
                    subjects: selectedSubjects, 
                    classes: selectedClasses,
                    subject: undefined, 
                    className: undefined 
                });
                if (d.password) u.password = d.password;
            } else {
                users.push({ 
                    id: DB.uid(), 
                    role: 'teacher', 
                    name: d.name, 
                    email: d.email, 
                    password: d.password, 
                    subjects: selectedSubjects, 
                    classes: selectedClasses 
                });
            }
            DB.set('users', users);
            closeModal();
            toast(editing ? 'Teacher updated.' : 'Teacher account created.');
            teachers();
        }
    });
}

/* ================= ATTENDANCE ================= */
const aState = { date: today(), cls: '' };

function attendance() {
    if (!aState.cls) {
        const me = getUsers().find(u => u.id === session.id);
        const allowedClasses = me && me.classes ? me.classes : (me && me.className ? [me.className] : CLASSES);
        aState.cls = allowedClasses[0] || CLASSES[0];
    }
    $('#view').innerHTML = `
        <div class="card">
            <div class="card-head"><h3>Mark attendance</h3>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-secondary" id="allP">Mark all present</button>
                    <button class="btn btn-secondary" id="expA"><i class="fa-solid fa-file-csv"></i> Export CSV</button>
                    <button class="btn btn-success" id="saveA"><i class="fa-solid fa-floppy-disk"></i> Save</button>
                </div></div>
            <div class="toolbar">
                <input type="date" id="aDate" value="${aState.date}" max="${today()}" style="flex:0 0 190px">
                <select id="aClass">${CLASSES.map(c => `<option ${c === aState.cls ? 'selected' : ''}>${c}</option>`).join('')}</select>
            </div>
            <div id="attBody"></div>
        </div>`;
    $('#aDate').onchange = e => { aState.date = e.target.value || today(); drawAttendance(); };
    $('#aClass').onchange = e => { aState.cls = e.target.value; drawAttendance(); };
    $('#allP').onclick = () => { document.querySelectorAll('input[value="P"]').forEach(r => r.checked = true); };
    $('#saveA').onclick = saveAttendance;
    $('#expA').onclick = exportAttendance;
    drawAttendance();
}

function drawAttendance() {
    const list = getStudents().filter(s => s.className === aState.cls && s.status === 'Active');
    const saved = DB.get('attendance', {})[aState.date + '|' + aState.cls] || {};
    $('#attBody').innerHTML = list.length ? `<div class="table-wrap"><table>
        <thead><tr><th>ID</th><th>Student</th><th>Status</th></tr></thead>
        <tbody>${list.map(s => `<tr><td>${esc(s.id)}</td><td><strong>${esc(s.name)}</strong></td>
            <td><div class="radio-group">${[['P', 'Present'], ['A', 'Absent'], ['L', 'Late']].map(([v, l]) =>
                `<label><input type="radio" name="att-${esc(s.id)}" value="${v}" ${(saved[s.id] || 'P') === v ? 'checked' : ''}> ${l}</label>`).join('')}</div></td></tr>`).join('')}
        </tbody></table></div>` : '<p class="empty">No active students in this class.</p>';
}

function saveAttendance() {
    const list = getStudents().filter(s => s.className === aState.cls && s.status === 'Active');
    if (!list.length) return toast('No students to save.', 'error');
    const rec = {};
    list.forEach(s => {
        const r = document.querySelector(`input[name="att-${s.id}"]:checked`);
        rec[s.id] = r ? r.value : 'P';
    });
    const all = DB.get('attendance', {});
    all[aState.date + '|' + aState.cls] = rec;
    DB.set('attendance', all);
    const absent = Object.values(rec).filter(v => v === 'A').length;
    toast(`Attendance saved. ${absent} absent.`);
}

function exportAttendance() {
    const all = DB.get('attendance', {});
    const names = Object.fromEntries(getStudents().map(s => [s.id, s]));
    const label = { P: 'Present', A: 'Absent', L: 'Late' };
    const rows = [];
    Object.keys(all).sort().forEach(k => {
        const [date, cls] = k.split('|');
        Object.entries(all[k]).forEach(([id, v]) => rows.push([date, cls, id, names[id] ? names[id].name : '(deleted)', label[v]]));
    });
    if (!rows.length) return toast('No attendance saved yet.', 'error');
    download(`attendance-${today()}.csv`, toCSV(['Date', 'Class', 'Student ID', 'Name', 'Status'], rows));
    toast('Attendance exported.');
}

/* ================= GRADES ================= */
const gState = { cls: '', subject: '', term: TERMS[0] };

function grades() {
    const me = getUsers().find(u => u.id === session.id) || {};
    if (!gState.cls) {
        const allowedClasses = me.classes || (me.className ? [me.className] : CLASSES);
        gState.cls = allowedClasses[0] || CLASSES[0];
    }
    if (!gState.subject) {
        const allowedSubjects = me.subjects || (me.subject ? [me.subject] : SUBJECTS);
        gState.subject = allowedSubjects[0] || SUBJECTS[0];
    }
    $('#view').innerHTML = `
        <div class="card">
            <div class="card-head"><h3>Enter grades</h3>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-secondary" id="expG"><i class="fa-solid fa-file-csv"></i> Export CSV</button>
                    <button class="btn btn-success" id="saveG"><i class="fa-solid fa-floppy-disk"></i> Save</button>
                </div></div>
            <div class="toolbar">
                <select id="gClass">${CLASSES.map(c => `<option ${c === gState.cls ? 'selected' : ''}>${c}</option>`).join('')}</select>
                <select id="gSubject">${SUBJECTS.map(c => `<option ${c === gState.subject ? 'selected' : ''}>${c}</option>`).join('')}</select>
                <select id="gTerm">${TERMS.map(c => `<option ${c === gState.term ? 'selected' : ''}>${c}</option>`).join('')}</select>
            </div>
            <div id="gradeBody"></div>
        </div>`;
    $('#gClass').onchange = e => { gState.cls = e.target.value; drawGrades(); };
    $('#gSubject').onchange = e => { gState.subject = e.target.value; drawGrades(); };
    $('#gTerm').onchange = e => { gState.term = e.target.value; drawGrades(); };
    $('#saveG').onclick = saveGrades;
    $('#expG').onclick = exportGrades;
    drawGrades();
}

const gKey = (term, subject, id) => `${term}|${subject}|${id}`;

function drawGrades() {
    const list = getStudents().filter(s => s.className === gState.cls && s.status === 'Active');
    const saved = DB.get('grades', {});
    $('#gradeBody').innerHTML = list.length ? `<div class="table-wrap"><table>
        <thead><tr><th>ID</th><th>Student</th><th>Score (0-100)</th><th>Grade</th></tr></thead>
        <tbody>${list.map(s => {
            const v = saved[gKey(gState.term, gState.subject, s.id)];
            return `<tr><td>${esc(s.id)}</td><td><strong>${esc(s.name)}</strong></td>
                <td><input class="score-input" type="number" min="0" max="100" data-id="${esc(s.id)}" value="${v == null ? '' : esc(v)}"></td>
                <td><span class="badge gray" id="lg-${esc(s.id)}">${v == null ? '-' : letter(v)}</span></td></tr>`;
        }).join('')}</tbody></table></div>` : '<p class="empty">No active students in this class.</p>';
    document.querySelectorAll('.score-input').forEach(i => i.oninput = () => {
        const badge = $('#lg-' + i.dataset.id);
        badge.textContent = i.value === '' ? '-' : letter(Number(i.value));
    });
}

function saveGrades() {
    const all = DB.get('grades', {});
    let bad = false, n = 0;
    document.querySelectorAll('.score-input').forEach(i => {
        const k = gKey(gState.term, gState.subject, i.dataset.id);
        if (i.value === '') { delete all[k]; return; }
        const v = Number(i.value);
        if (isNaN(v) || v < 0 || v > 100) { bad = true; i.style.borderColor = 'var(--danger)'; return; }
        i.style.borderColor = ''; all[k] = v; n++;
    });
    if (bad) return toast('Scores must be between 0 and 100.', 'error');
    DB.set('grades', all);
    toast(`Saved ${n} score${n === 1 ? '' : 's'}.`);
}

function exportGrades() {
    const all = DB.get('grades', {});
    const names = Object.fromEntries(getStudents().map(s => [s.id, s]));
    const rows = Object.keys(all).sort().map(k => {
        const [term, subject, id] = k.split('|');
        const s = names[id];
        return [term, subject, id, s ? s.name : '(deleted)', s ? s.className : '', all[k], letter(all[k])];
    });
    if (!rows.length) return toast('No grades saved yet.', 'error');
    download(`grades-${today()}.csv`, toCSV(['Term', 'Subject', 'Student ID', 'Name', 'Class', 'Score', 'Grade'], rows));
    toast('Grades exported.');
}

function reportCard(id) {
    const s = getStudents().find(x => x.id === id);
    const all = DB.get('grades', {});
    let term = TERMS[0];
    const render = () => {
        const rows = SUBJECTS.map(sub => [sub, all[gKey(term, sub, id)]]).filter(r => r[1] != null);
        const avg = rows.length ? rows.reduce((a, r) => a + r[1], 0) / rows.length : null;
        $('#rcBody').innerHTML = `
            <h3>Student Report Card</h3><p class="sub">${esc(s.name)} (${esc(s.id)}) · ${esc(s.className)} · ${esc(term)}</p>
            <div class="table-wrap"><table><thead><tr><th>Subject</th><th>Score</th><th>Grade</th></tr></thead><tbody>
            ${rows.length ? rows.map(r => `<tr><td>${esc(r[0])}</td><td>${r[1]}</td><td>${letter(r[1])}</td></tr>`).join('') +
                `<tr><td><strong>Average</strong></td><td><strong>${avg.toFixed(1)}</strong></td><td><strong>${letter(avg)}</strong></td></tr>`
                : '<tr><td colspan="3" class="empty">No grades recorded for this term.</td></tr>'}
            </tbody></table></div>`;
    };
    openModal('Report card', `
        <div class="form-group" style="max-width:200px"><label>Term</label>
            <select id="rcTerm">${TERMS.map(t => `<option>${t}</option>`).join('')}</select></div>
        <div id="reportCard" class="report-card"><div id="rcBody"></div></div>`, {
        extra: '<button type="button" class="btn btn-primary" id="rcPrint"><i class="fa-solid fa-print"></i> Print</button>'
    });
    $('#rcTerm').onchange = e => { term = e.target.value; render(); };
    $('#rcPrint').onclick = () => window.print();
    render();
}

/* ================= ANNOUNCEMENTS ================= */
function announcementHtml(a) {
    return `<div class="announcement ${a.priority === 'Urgent' ? 'urgent' : ''}">
        <div class="meta">${esc(a.date)} · ${esc(a.author)} ${a.priority === 'Urgent' ? '<span class="badge red">Urgent</span>' : ''}</div>
        <h4>${esc(a.title)}</h4><p>${esc(a.message).replace(/\n/g, '<br>')}</p></div>`;
}

function announcements() {
    const list = DB.get('announcements', []);
    $('#view').innerHTML = `
        <div class="card">
            <div class="card-head"><h3>Announcements</h3>
                ${isAdmin ? '<button class="btn btn-primary" id="addAn"><i class="fa-solid fa-plus"></i> New Announcement</button>' : ''}</div>
            ${list.length ? list.map(a => `<div>${announcementHtml(a)}${(isAdmin || a.author === session.name) ? `<div style="margin:-6px 0 14px;text-align:right"><button class="btn btn-secondary btn-sm" data-del="${esc(a.id)}"><i class="fa-solid fa-trash"></i> Delete</button></div>` : ''}</div>`).join('')
                : '<p class="empty">No announcements yet.</p>'}
        </div>`;
    
    if (isAdmin) {
        $('#addAn').onclick = () => openModal('New announcement', `
            ${field('Title', 'title', '')}
            ${field('Priority', 'priority', 'Normal', { options: ['Normal', 'Urgent'] })}
            ${field('Message', 'message', '', { textarea: true })}
            <div class="alert alert-error" id="formErr"></div>`, {
            submitLabel: 'Post',
            onSubmit(fd) {
                const d = Object.fromEntries(fd);
                if (!d.title.trim() || !d.message.trim()) {
                    $('#formErr').textContent = 'Title and message are required.';
                    $('#formErr').classList.add('show');
                    return;
                }
                const all = DB.get('announcements', []);
                all.unshift({ id: DB.uid(), title: d.title.trim(), message: d.message.trim(), priority: d.priority, author: session.name, date: today() });
                DB.set('announcements', all);
                closeModal();
                toast('Announcement posted.');
                announcements();
            }
        });
    }

    $('#view').querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
        if (!confirm('Delete this announcement?')) return;
        DB.set('announcements', DB.get('announcements', []).filter(a => a.id !== b.dataset.del));
        announcements();
    });
}

/* ---------- Init ---------- */
$('#userName').textContent = session.name;
const rb = $('#userRole');
rb.textContent = session.role;
rb.className = 'role-badge ' + session.role;

const applyTheme = t => {
    document.documentElement.setAttribute('data-theme', t);
    $('#themeBtn').innerHTML = `<i class="fa-solid ${t === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;
};
applyTheme(DB.get('theme', 'light'));
$('#themeBtn').onclick = () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    DB.set('theme', next);
    applyTheme(next);
};
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

go('dashboard');