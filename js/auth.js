/* ===== AUTHENTICATION MODULE ===== */

// Demo user credentials (in a real app, this would be server-side)
const DEMO_USERS = [
    { email: 'admin@school.edu', password: 'admin123', name: 'Administrator' },
    { email: 'teacher@school.edu', password: 'teacher123', name: 'Teacher' }
];

// Initialize login form
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);

        // Real-time validation
        const emailEl = document.getElementById('email');
        const passwordEl = document.getElementById('password');
        if (emailEl) emailEl.addEventListener('input', validateEmail);
        if (passwordEl) passwordEl.addEventListener('input', validatePassword);
    }
});

function validateEmail() {
    const email = document.getElementById('email');
    const error = document.getElementById('emailError');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.value.trim()) {
        email.classList.add('error');
        error.textContent = 'Email is required';
        error.classList.add('show');
        return false;
    } else if (!emailRegex.test(email.value.trim())) {
        email.classList.add('error');
        error.textContent = 'Please enter a valid email address';
        error.classList.add('show');
        return false;
    } else {
        email.classList.remove('error');
        error.classList.remove('show');
        return true;
    }
}

function validatePassword() {
    const password = document.getElementById('password');
    const error = document.getElementById('passwordError');

    if (!password.value) {
        password.classList.add('error');
        error.textContent = 'Password is required';
        error.classList.add('show');
        return false;
    } else if (password.value.length < 6) {
        password.classList.add('error');
        error.textContent = 'Password must be at least 6 characters';
        error.classList.add('show');
        return false;
    } else {
        password.classList.remove('error');
        error.classList.remove('show');
        return true;
    }
}

function handleLogin(e) {
    e.preventDefault();

    const emailValid = validateEmail();
    const passwordValid = validatePassword();
    if (!emailValid || !passwordValid) return;

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const alertBox = document.getElementById('loginAlert');

    const user = DEMO_USERS.find(u => u.email === email && u.password === password);

    if (user) {
        localStorage.setItem('currentUser', JSON.stringify({
            email: user.email,
            name: user.name,
            loginTime: new Date().toISOString()
        }));

        alertBox.className = 'alert alert-success show';
        alertBox.textContent = '✓ Login successful! Redirecting...';

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 800);
    } else {
        alertBox.className = 'alert alert-error show';
        alertBox.textContent = '✗ Invalid email or password. Please try again.';

        // Shake animation
        const card = document.querySelector('.login-card');
        if (card) {
            card.style.animation = 'none';
            setTimeout(() => {
                card.style.animation = 'slideUp 0.5s ease';
            }, 10);
        }
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Reset demo data (for testing)
function resetDemo() {
    if (confirm('Reset all demo data? This will clear all students and activities.')) {
        localStorage.clear();
        location.reload();
    }
}