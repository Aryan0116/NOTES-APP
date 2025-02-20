// DOM Elements
const authContainer = document.getElementById('authContainer');
const appContainer = document.getElementById('appContainer');
const authForm = document.getElementById('authForm');
const authToggle = document.getElementById('authToggle');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const signOutBtn = document.getElementById('signOutBtn');
const userDisplay = document.getElementById('userDisplay');
const toast = document.getElementById('toast');

// API Configuration
const API_URL = 'https://notes-app-ni8n.onrender.com'; // Change this to your deployed API URL in production

// State management
let isLogin = true;
let currentUser = null;

// API Functions
async function loginUser(username, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    } catch (error) {
        throw error;
    }
}

async function registerUser(username, password) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    } catch (error) {
        throw error;
    }
}

async function fetchNotes(userId) {
    const response = await fetch(`${API_URL}/notes/${userId}`);
    return await response.json();
}

async function fetchSubjects(userId) {
    const response = await fetch(`${API_URL}/subjects/${userId}`);
    return await response.json();
}

async function createNote(noteData) {
    const response = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
    });
    return await response.json();
}

async function createSubject(subjectData) {
    const response = await fetch(`${API_URL}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjectData)
    });
    return await response.json();
}

// Auth functions
function toggleAuth(e) {
    e.preventDefault();
    isLogin = !isLogin;
    authTitle.textContent = isLogin ? 'Welcome Back' : 'Create an Account';
    authSubtitle.textContent = isLogin
        ? 'Enter your credentials to access your notes'
        : 'Sign up to start taking notes';
    authToggle.textContent = isLogin ? 'Sign Up' : 'Sign In';
}

async function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showToast('Please fill in all fields');
        return;
    }

    try {
        if (isLogin) {
            const userData = await loginUser(username, password);
            currentUser = userData;
            showToast('Welcome back!');
            showApp();
        } else {
            await registerUser(username, password);
            const userData = await loginUser(username, password);
            currentUser = userData;
            showToast('Account created successfully!');
            showApp();
        }
    } catch (error) {
        showToast(error.message || 'An error occurred');
    }
}

// Navigation functions
async function showApp() {
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    userDisplay.textContent = currentUser.username;
    await loadDashboard();
}

function handleNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    navLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const targetPage = link.dataset.page;
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            pages.forEach(page => {
                if (page.id === `${targetPage}Page`) {
                    page.classList.remove('hidden');
                } else {
                    page.classList.add('hidden');
                }
            });

            if (targetPage === 'dashboard') await loadDashboard();
            if (targetPage === 'notes') await loadNotes();
            if (targetPage === 'subjects') await loadSubjects();
        });
    });
}

// Content loading functions
async function loadDashboard() {
    try {
        const [notes, subjects] = await Promise.all([
            fetchNotes(currentUser.userId),
            fetchSubjects(currentUser.userId)
        ]);

        document.getElementById('totalNotes').textContent = notes.length;
        document.getElementById('totalSubjects').textContent = subjects.length;

        // Load recent notes
        const recentNotes = notes.slice(-3).reverse();
        const recentNotesList = document.getElementById('recentNotesList');
        recentNotesList.innerHTML = recentNotes.map(note => `
            <div class="note-card">
                <h3>${note.title}</h3>
                <div class="meta">
                    <span>${new Date(note.date).toLocaleDateString()}</span>
                    <span>${subjects.find(s => s._id === note.subjectId)?.name || 'Unknown Subject'}</span>
                </div>
                <p>${note.content.substring(0, 100)}...</p>
            </div>
        `).join('');
    } catch (error) {
        showToast('Error loading dashboard');
        console.error(error);
    }
}

async function loadNotes() {
    try {
        const [notes, subjects] = await Promise.all([
            fetchNotes(currentUser.userId),
            fetchSubjects(currentUser.userId)
        ]);

        const notesList = document.getElementById('notesList');
        notesList.innerHTML = notes.map(note => `
            <div class="note-card">
                <h3>${note.title}</h3>
                <div class="meta">
                    <span>${new Date(note.date).toLocaleDateString()}</span>
                    <span>${subjects.find(s => s._id === note.subjectId)?.name || 'Unknown Subject'}</span>
                </div>
                <p>${note.content.substring(0, 100)}...</p>
            </div>
        `).join('');
    } catch (error) {
        showToast('Error loading notes');
        console.error(error);
    }
}

async function loadSubjects() {
    try {
        const subjects = await fetchSubjects(currentUser.userId);
        const notes = await fetchNotes(currentUser.userId);
        
        const subjectsList = document.getElementById('subjectsList');
        subjectsList.innerHTML = subjects.map(subject => `
            <div class="subject-card">
                <h3>${subject.name}</h3>
                <p>${notes.filter(note => note.subjectId === subject._id).length} notes</p>
            </div>
        `).join('');
    } catch (error) {
        showToast('Error loading subjects');
        console.error(error);
    }
}

// Helper functions
function showToast(message) {
    const toastMessage = document.querySelector('.toast-message');
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Modal handling
function setupModals() {
    const newNoteBtn = document.getElementById('newNoteBtn');
    const newSubjectBtn = document.getElementById('newSubjectBtn');
    const noteModal = document.getElementById('noteModal');
    const subjectModal = document.getElementById('subjectModal');
    const closeNoteModal = document.getElementById('closeNoteModal');
    const closeSubjectModal = document.getElementById('closeSubjectModal');
    const noteForm = document.getElementById('noteForm');
    const subjectForm = document.getElementById('subjectForm');

    // Note modal
    newNoteBtn?.addEventListener('click', async () => {
        noteModal.classList.remove('hidden');
        await loadSubjectOptions();
    });
    closeNoteModal?.addEventListener('click', () => noteModal.classList.add('hidden'));

    // Subject modal
    newSubjectBtn?.addEventListener('click', () => subjectModal.classList.remove('hidden'));
    closeSubjectModal?.addEventListener('click', () => subjectModal.classList.add('hidden'));

    // Handle form submissions
    noteForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('noteTitle').value;
        const subjectId = document.getElementById('noteSubject').value;
        const content = document.getElementById('noteContent').value;

        try {
            await createNote({
                title,
                content,
                subjectId,
                userId: currentUser.userId
            });
            noteModal.classList.add('hidden');
            noteForm.reset();
            showToast('Note saved successfully!');
            await loadNotes();
            await loadDashboard();
        } catch (error) {
            showToast('Error saving note');
            console.error(error);
        }
    });

    subjectForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('subjectName').value;

        try {
            await createSubject({
                name,
                userId: currentUser.userId
            });
            subjectModal.classList.add('hidden');
            subjectForm.reset();
            showToast('Subject added successfully!');
            await loadSubjects();
            await loadDashboard();
        } catch (error) {
            showToast('Error adding subject');
            console.error(error);
        }
    });
}

async function loadSubjectOptions() {
    try {
        const subjects = await fetchSubjects(currentUser.userId);
        const select = document.getElementById('noteSubject');
        
        select.innerHTML = '<option value="">Select Subject</option>' +
            subjects.map(subject => 
                `<option value="${subject._id}">${subject.name}</option>`
            ).join('');
    } catch (error) {
        showToast('Error loading subjects');
        console.error(error);
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showApp();
        } catch (error) {
            localStorage.removeItem('currentUser');
        }
    }

    // Setup event listeners
    authToggle?.addEventListener('click', toggleAuth);
    authForm?.addEventListener('submit', handleAuth);
    signOutBtn?.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        currentUser = null;
        appContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
        showToast('Signed out successfully');
    });

    handleNavigation();
    setupModals();
});
