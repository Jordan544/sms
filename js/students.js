/* ===== STUDENT MANAGEMENT MODULE ===== */

const STORAGE_KEY = 'school_students';
const ACTIVITY_KEY = 'school_activities';
const SEED_FLAG = 'school_seeded';

// ===== SAMPLE DATA INITIALIZATION =====
function initializeSampleData() {
    const existing = localStorage.getItem(STORAGE_KEY);
    const alreadySeeded = localStorage.getItem(SEED_FLAG);

    // If we've already seeded before (even if user deleted all), don't re-seed
    if (existing !== null || alreadySeeded) return;

    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const sampleStudents = [
        {
            id: 'STU-2024-001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@email.com',
            phone: '+256 700 111 111',
            dob: '2008-05-14',
            gender: 'Male',
            class: 'Senior 2',
            enrollmentDate: `${thisMonth}-05`,
            address: 'Kampala, Uganda',
            status: 'Active',
            createdAt: `${thisMonth}-05T08:00:00Z`
        },
        {
            id: 'STU-2024-002',
            firstName: 'Sarah',
            lastName: 'Nakato',
            email: 'sarah.nakato@email.com',
            phone: '+256 700 222 222',
            dob: '2007-11-22',
            gender: 'Female',
            class: 'Senior 3',
            enrollmentDate: `${thisMonth}-08`,
            address: 'Entebbe, Uganda',
            status: 'Active',
            createdAt: `${thisMonth}-08T09:30:00Z`
        },
        {
            id: 'STU-2024-003',
            firstName: 'Michael',
            lastName: 'Okello',
            email: 'michael.okello@email.com',
            phone: '+256 700 333 333',
            dob: '2009-03-08',
            gender: 'Male',
            class: 'Senior 1',
            enrollmentDate: '2024-01-15',
            address: 'Gulu, Uganda',
            status: 'Active',
            createdAt: '2024-01-15T10:15:00Z'
        },
        {
            id: 'STU-2024-004',
            firstName: 'Grace',
            lastName: 'Auma',
            email: 'grace.auma@email.com',
            phone: '+256 700 444 444',
            dob: '2006-09-30',
            gender: 'Female',
            class: 'Senior 4',
            enrollmentDate: '2024-02-10',
            address: 'Mbale, Uganda',
            status: 'Inactive',
            createdAt: '2024-02-10T14:20:00Z'
        },
        {
            id: 'STU-2024-005',
            firstName: 'David',
            lastName: 'Ssemakula',
            email: 'david.ssemakula@email.com',
            phone: '+256 700 555 555',
            dob: '2008-12-05',
            gender: 'Male',
            class: 'Senior 2',
            enrollmentDate: `${thisMonth}-20`,
            address: 'Jinja, Uganda',
            status: 'Active',
            createdAt: `${thisMonth}-20T11:45:00Z`
        }
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleStudents));
    localStorage.setItem(SEED_FLAG, 'true');
}

// ===== DATA ACCESS HELPERS =====
function getStudents() {
    initializeSampleData();
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveStudents(students) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function getStudentById(id) {
    return getStudents().find(s => s.id === id);
}

function generateStudentId() {
    const students = getStudents();
    const year = new Date().getFullYear();
    const num = String(students.length + 1).padStart(3, '0');
    return `STU-${year}-${num}`;
}

// ===== ACTIVITY LOGGING =====
function logActivity(text) {
    let activities = [];
    try {
        activities = JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || [];
    } catch (e) {
        activities = [];
    }
    activities.unshift({
        text: text,
        time: new Date().toISOString()
    });
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activities.slice(0, 10)));
}

// ===== DELETE STUDENT =====
function deleteStudent(id) {
    const student = getStudentById(id);
    if (!student) return false;

    if (!confirm(`Are you sure you want to delete ${student.firstName} ${student.lastName} (${student.id})?\n\nThis action cannot be undone.`)) {
        return false;
    }

    const students = getStudents();
    const updated = students.filter(s => s.id !== id);
    saveStudents(updated);

    logActivity(`Deleted student: ${student.firstName} ${student.lastName} (${student.id})`);

    // Refresh table if we're on the list page
    if (typeof renderStudentTable === 'function' && document.getElementById('studentTableBody')) {
        const searchBox = document.getElementById('searchInput');
        renderStudentTable(searchBox ? searchBox.value : '');
    }

    showToast(`✓ Student ${student.firstName} ${student.lastName} deleted successfully.`, 'success');
    return true;
}

// Delete from details page and go back
function deleteStudentAndGoBack(id) {
    if (deleteStudent(id)) {
        setTimeout(() => {
            window.location.href = 'students.html';
        }, 900);
    }
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'success') {
    const existing = document.getElementById('toastNotification');
    if (existing) existing.remove();

    const colors = {
        success: '#34a853',
        error: '#ea4335',
        info: '#1a73e8'
    };

    const toast = document.createElement('div');
    toast.id = 'toastNotification';
    toast.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        padding: 16px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        max-width: 360px;
        color: white;
        background: ${colors[type] || colors.info};
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== FORM VALIDATION HELPERS =====
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + 'Error');
    if (field) field.classList.add('error');
    if (error) {
        error.textContent = message;
        error.classList.add('show');
    }
}

function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + 'Error');
    if (field) field.classList.remove('error');
    if (error) error.classList.remove('show');
}

function clearAllErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
}

// ===== REGISTRATION FORM =====
function initRegistrationForm() {
    // Set default enrollment date to today
    const today = new Date().toISOString().split('T')[0];
    const enrollDate = document.getElementById('enrollmentDate');
    if (enrollDate) enrollDate.value = today;

    const form = document.getElementById('studentForm');
    if (form) {
        form.addEventListener('submit', handleRegistration);

        // Real-time validation on blur
        ['firstName', 'lastName', 'email', 'phone', 'dob', 'gender', 'class', 'enrollmentDate']
            .forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener('blur', () => validateField(id));
                    el.addEventListener('input', () => clearError(id));
                }
            });
    }
}

function validateField(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return true;
    const value = el.value.trim();

    switch (fieldId) {
        case 'firstName':
        case 'lastName':
            if (!value) {
                showError(fieldId, 'This field is required');
                return false;
            }
            if (value.length < 2) {
                showError(fieldId, 'Must be at least 2 characters');
                return false;
            }
            break;
        case 'email':
            if (!value) {
                showError(fieldId, 'Email is required');
                return false;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                showError(fieldId, 'Enter a valid email address');
                return false;
            }
            // Check duplicate (case-insensitive)
            const exists = getStudents().some(s => s.email.toLowerCase() === value.toLowerCase());
            if (exists) {
                showError(fieldId, 'This email is already registered');
                return false;
            }
            break;
        case 'phone':
            if (!value) {
                showError(fieldId, 'Phone number is required');
                return false;
            }
            if (!/^[+\d\s()-]{7,20}$/.test(value)) {
                showError(fieldId, 'Enter a valid phone number');
                return false;
            }
            break;
        case 'dob':
            if (!value) {
                showError(fieldId, 'Date of birth is required');
                return false;
            }
            const dob = new Date(value);
            const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            if (age < 5 || age > 100) {
                showError(fieldId, 'Please enter a valid date of birth');
                return false;
            }
            break;
        case 'gender':
        case 'class':
            if (!value) {
                showError(fieldId, 'Please make a selection');
                return false;
            }
            break;
        case 'enrollmentDate':
            if (!value) {
                showError(fieldId, 'Enrollment date is required');
                return false;
            }
            break;
    }

    clearError(fieldId);
    return true;
}

function handleRegistration(e) {
    e.preventDefault();

    const fields = ['firstName', 'lastName', 'email', 'phone', 'dob', 'gender', 'class', 'enrollmentDate'];
    let isValid = true;

    fields.forEach(f => {
        if (!validateField(f)) isValid = false;
    });

    if (!isValid) {
        const alertBox = document.getElementById('formAlert');
        alertBox.className = 'alert alert-error show';
        alertBox.textContent = '✗ Please fix the errors above before submitting.';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    // Build student object
    const newStudent = {
        id: generateStudentId(),
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        class: document.getElementById('class').value,
        enrollmentDate: document.getElementById('enrollmentDate').value,
        address: document.getElementById('address').value.trim() || 'N/A',
        status: 'Active',
        createdAt: new Date().toISOString()
    };

    const students = getStudents();
    students.push(newStudent);
    saveStudents(students);

    logActivity(`Registered new student: ${newStudent.firstName} ${newStudent.lastName} (${newStudent.id})`);

    // Show success
    const alertBox = document.getElementById('formAlert');
    alertBox.className = 'alert alert-success show';
    alertBox.textContent = `✓ Student ${newStudent.firstName} ${newStudent.lastName} registered successfully! ID: ${newStudent.id}`;

    // Reset form
    document.getElementById('studentForm').reset();
    document.getElementById('enrollmentDate').value = new Date().toISOString().split('T')[0];
    clearAllErrors('studentForm');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Redirect after 2 seconds
    setTimeout(() => {
        window.location.href = 'students.html';
    }, 2000);
}

// ===== STUDENT LIST =====
function initStudentList() {
    renderStudentTable();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderStudentTable(e.target.value);
        });
    }
}

function renderStudentTable(filter = '') {
    const students = getStudents();
    const tbody = document.getElementById('studentTableBody');
    const emptyState = document.getElementById('emptyState');
    const countEl = document.getElementById('studentCount');

    if (!tbody) return;

    const q = filter.toLowerCase().trim();
    const filtered = students.filter(s => {
        if (!q) return true;
        return (
            s.firstName.toLowerCase().includes(q) ||
            s.lastName.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) ||
            s.class.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q)
        );
    });

    if (countEl) countEl.textContent = filtered.length;

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map(s => `
        <tr>
            <td><strong>${s.id}</strong></td>
            <td>${s.firstName} ${s.lastName}</td>
            <td>${s.email}</td>
            <td>${s.class}</td>
            <td>
                <span class="badge ${s.status === 'Active' ? 'badge-active' : 'badge-inactive'}">
                    ${s.status}
                </span>
            </td>
            <td>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <a href="student-details.html?id=${s.id}" class="btn btn-primary btn-sm">View</a>
                    <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== STUDENT DETAILS =====
function initStudentDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const container = document.getElementById('detailsContainer');

    if (!container) return;

    if (!id) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>No student selected</h3>
                <p>Please go back and select a student from the list.</p>
                <div style="margin-top:24px;">
                    <a href="students.html" class="btn btn-primary">← Back to Student List</a>
                </div>
            </div>`;
        return;
    }

    const student = getStudentById(id);

    if (!student) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>Student not found</h3>
                <p>The student with ID "${id}" does not exist.</p>
                <div style="margin-top:24px;">
                    <a href="students.html" class="btn btn-primary">← Back to Student List</a>
                </div>
            </div>`;
        return;
    }

    const initials = (student.firstName[0] + student.lastName[0]).toUpperCase();
    const age = Math.floor((Date.now() - new Date(student.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));

    container.innerHTML = `
        <div class="details-card">
            <div class="details-header">
                <div class="details-avatar">${initials}</div>
                <div>
                    <h2>${student.firstName} ${student.lastName}</h2>
                    <p>${student.id} • ${student.class}</p>
                </div>
            </div>
            <div class="details-body">
                <div class="details-grid">
                    <div class="detail-item">
                        <label>Email Address</label>
                        <p>${student.email}</p>
                    </div>
                    <div class="detail-item">
                        <label>Phone Number</label>
                        <p>${student.phone}</p>
                    </div>
                    <div class="detail-item">
                        <label>Date of Birth</label>
                        <p>${new Date(student.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} (Age: ${age})</p>
                    </div>
                    <div class="detail-item">
                        <label>Gender</label>
                        <p>${student.gender}</p>
                    </div>
                    <div class="detail-item">
                        <label>Class</label>
                        <p>${student.class}</p>
                    </div>
                    <div class="detail-item">
                        <label>Enrollment Date</label>
                        <p>${new Date(student.enrollmentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div class="detail-item">
                        <label>Status</label>
                        <p><span class="badge ${student.status === 'Active' ? 'badge-active' : 'badge-inactive'}">${student.status}</span></p>
                    </div>
                    <div class="detail-item">
                        <label>Address</label>
                        <p>${student.address}</p>
                    </div>
                </div>
                <div style="margin-top:32px; padding-top:24px; border-top:1px solid #f1f3f4; display:flex; gap:12px; flex-wrap:wrap;">
                    <button class="btn btn-danger" onclick="deleteStudentAndGoBack('${student.id}')">🗑️ Delete Student</button>
                    <a href="students.html" class="btn btn-secondary">← Back to Student List</a>
                </div>
            </div>
        </div>
    `;
}