seedData();
if (getSession()) location.replace('dashboard.html');

const loginForm = document.getElementById('loginForm');
const loginAlert = document.getElementById('loginAlert');

function setError(inputId, errorId, show) {
    document.getElementById(errorId).classList.toggle('show', show);
    document.getElementById(inputId).closest('.form-group').classList.toggle('has-error', show);
}

function showAlert(msg, type) {
    loginAlert.textContent = msg;
    loginAlert.className = 'alert alert-' + type + ' show';
}

loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    loginAlert.classList.remove('show');

    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passOk = password.length >= 6;
    setError('email', 'emailError', !emailOk);
    setError('password', 'passwordError', !passOk);
    if (!emailOk || !passOk) return;

    const user = DB.get('users', []).find(u => u.email.toLowerCase() === email && u.password === password);
    if (!user) { showAlert('Incorrect email or password.', 'error'); return; }

    setSession(user);
    location.replace('dashboard.html');
});

function fillDemo(role) {
    document.getElementById('email').value = role === 'admin' ? 'admin@school.edu' : 'teacher@school.edu';
    document.getElementById('password').value = role === 'admin' ? 'admin123' : 'teacher123';
}

function resetDemo() {
    if (!confirm('This will erase all saved data and restore the demo data. Continue?')) return;
    DB.clearAll();
    seedData();
    showAlert('Demo data has been reset.', 'success');
}
