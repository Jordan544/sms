/* Shared storage layer, seed data and session helpers (localStorage based demo) */
const DB = {
    get(key, fallback) {
        try {
            const v = localStorage.getItem('sms_' + key);
            return v ? JSON.parse(v) : fallback;
        } catch (e) { return fallback; }
    },
    set(key, value) { localStorage.setItem('sms_' + key, JSON.stringify(value)); },
    uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },
    clearAll() {
        Object.keys(localStorage).filter(k => k.startsWith('sms_') && k !== 'sms_theme')
            .forEach(k => localStorage.removeItem(k));
    }
};

const CLASSES = ['Senior 1', 'Senior 2', 'Senior 3', 'Senior 4', 'Senior 5', 'Senior 6'];
const SUBJECTS = ['Mathematics', 'English', 'Science', 'History', 'Geography', 'ICT'];
const TERMS = ['Term 1', 'Term 2', 'Term 3'];

/* One-time conversion of older saved data: Grade 7-12 -> Senior 1-6 */
function migrateClasses() {
    const map = { 'Grade 7': 'Senior 1', 'Grade 8': 'Senior 2', 'Grade 9': 'Senior 3',
                  'Grade 10': 'Senior 4', 'Grade 11': 'Senior 5', 'Grade 12': 'Senior 6' };
    const fix = c => map[c] || c;
    const users = DB.get('users', null);
    if (!users) return;
    if (!users.some(u => map[u.className]) && !DB.get('students', []).some(s => map[s.className])) return;
    DB.set('users', users.map(u => ({ ...u, className: fix(u.className) })));
    DB.set('students', DB.get('students', []).map(s => ({ ...s, className: fix(s.className) })));
    const att = DB.get('attendance', {}), newAtt = {};
    Object.keys(att).forEach(k => {
        const [date, cls] = k.split('|');
        newAtt[date + '|' + fix(cls)] = att[k];
    });
    DB.set('attendance', newAtt);
}

function seedData() {
    migrateClasses();
    if (DB.get('users', null)) return;

    DB.set('users', [
        { id: 'u-admin', name: 'System Admin', email: 'admin@school.edu', password: 'admin123', role: 'admin', subject: '', className: '' },
        { id: 'u-teacher', name: 'Grace Mensah', email: 'teacher@school.edu', password: 'teacher123', role: 'teacher', subject: 'Mathematics', className: 'Senior 3' }
    ]);

    const names = [
        ['Amina Nakato', 'Female', 'Senior 1'], ['Brian Okello', 'Male', 'Senior 1'],
        ['Cynthia Achieng', 'Female', 'Senior 1'], ['Daniel Kato', 'Male', 'Senior 1'],
        ['Esther Namukasa', 'Female', 'Senior 2'], ['Felix Mugisha', 'Male', 'Senior 2'],
        ['Grace Atim', 'Female', 'Senior 2'], ['Hassan Mukasa', 'Male', 'Senior 2'],
        ['Irene Auma', 'Female', 'Senior 3'], ['Joel Tumusiime', 'Male', 'Senior 3'],
        ['Kevin Opio', 'Male', 'Senior 3'], ['Lydia Nabirye', 'Female', 'Senior 3'],
        ['Mark Kigozi', 'Male', 'Senior 4'], ['Natalie Nassozi', 'Female', 'Senior 4'],
        ['Oscar Mwesigwa', 'Male', 'Senior 4'], ['Patricia Akello', 'Female', 'Senior 4'],
        ['Quentin Wante', 'Male', 'Senior 5'], ['Rachel Nambatya', 'Female', 'Senior 5'],
        ['Samuel Ssemwanga', 'Male', 'Senior 5'], ['Tricia Kemigisha', 'Female', 'Senior 5'],
        ['Umaru Mayanja', 'Male', 'Senior 6'], ['Vivian Kiconco', 'Female', 'Senior 6'],
        ['Walter Bwire', 'Male', 'Senior 6'], ['Xavier Mpiima', 'Female', 'Senior 6'],
        ['Yvette Nanyonjo', 'Female', 'Senior 1'], ['Zachary Lubega', 'Male', 'Senior 3'],
        ['Bridget Nanteza', 'Female', 'Senior 4'], ['Elijah Ssenyonga', 'Male', 'Senior 5'],
        ['Daphine Namazzi', 'Female', 'Senior 6'], ['Ronnie Mwebaze', 'Male', 'Senior 2']
    ];
    
    DB.set('students', names.map((n, i) => ({
        id: 'S' + String(1001 + i),
        name: n[0],
        email: n[0].toLowerCase().replace(/[^a-z]+/g, '.') + '@student.school.edu',
        gender: n[1],
        className: n[2],
        dob: (2008 + Math.floor(Math.random() * 5)) + '-0' + (1 + (i % 9)) + '-1' + (i % 9),
        guardian: 'Guardian of ' + n[0].split(' ')[0],
        phone: '+2567' + String(10000000 + i * 37211).slice(0, 8),
        status: 'Active'
    })));

    DB.set('attendance', {});
    DB.set('grades', {});
    DB.set('announcements', [{
        id: DB.uid(), title: 'Welcome to the new term',
        message: 'Teachers, please make sure attendance is marked every morning before 9:00.',
        priority: 'Normal', author: 'System Admin', date: new Date().toISOString().slice(0, 10)
    }]);
}

function getSession() { return DB.get('session', null); }
function setSession(user) { DB.set('session', { id: user.id, name: user.name, email: user.email, role: user.role }); }
function logout() { localStorage.removeItem('sms_session'); location.replace('index.html'); }