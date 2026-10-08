// ==========================================
// 1. SUPABASE CONFIGURATION
// ==========================================
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';

let supabaseClient = null;
if (window.supabase && SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// सीक्रेट पासवर्ड
const VAULT_PASSWORD = 'Nikhil@200483H';

// ==========================================
// 2. MODAL & VIEW SWITCHING LOGIC
// ==========================================
const adminModal = document.getElementById('admin-modal');
const modalWindow = document.getElementById('modal-window');
const viewVerify = document.getElementById('view-verify');
const viewDashboard = document.getElementById('view-dashboard');
const lockTriggerBtn = document.getElementById('lock-trigger-btn');
const secretStarBtn = document.getElementById('secret-star-btn');
const modalCloseBtn = document.getElementById('modal-close-btn');

const vaultPassInput = document.getElementById('vault-pass-input');
const unlockVaultBtn = document.getElementById('unlock-vault-btn');
const verifyError = document.getElementById('verify-error');
const togglePassEye = document.getElementById('toggle-pass-eye');

function openAdminModal() {
    if (!adminModal) return;
    adminModal.classList.add('open');
    modalWindow.classList.remove('dashboard-mode');
    viewVerify.classList.add('active');
    viewDashboard.classList.remove('active');
    vaultPassInput.value = '';
    verifyError.style.display = 'none';
    vaultPassInput.focus();
}

function closeAdminModal() {
    if (!adminModal) return;
    adminModal.classList.remove('open');
}

if (lockTriggerBtn) lockTriggerBtn.addEventListener('click', openAdminModal);
if (secretStarBtn) secretStarBtn.addEventListener('click', openAdminModal);
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeAdminModal);

window.addEventListener('click', (e) => {
    if (e.target === adminModal) closeAdminModal();
});

if (togglePassEye) {
    togglePassEye.addEventListener('click', () => {
        const type = vaultPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
        vaultPassInput.setAttribute('type', type);
        togglePassEye.classList.toggle('fa-eye-slash');
    });
}

function handleUnlock() {
    const entered = vaultPassInput.value.trim();
    if (entered === VAULT_PASSWORD) {
        verifyError.style.display = 'none';
        modalWindow.classList.add('dashboard-mode');
        viewVerify.classList.remove('active');
        viewDashboard.classList.add('active');
        loadAllProjects();
    } else {
        verifyError.style.display = 'block';
        vaultPassInput.value = '';
        vaultPassInput.focus();
    }
}

if (unlockVaultBtn) unlockVaultBtn.addEventListener('click', handleUnlock);
if (vaultPassInput) {
    vaultPassInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUnlock();
    });
}

// ==========================================
// 3. TAB CONTROLS (URL vs Upload File)
// ==========================================
const tabUrl = document.getElementById('tab-url-mode');
const tabFile = document.getElementById('tab-file-mode');
const blockUrl = document.getElementById('url-input-block');
const blockFile = document.getElementById('file-input-block');
let activeImageMode = 'url'; // 'url' या 'file'

if (tabUrl && tabFile) {
    tabUrl.addEventListener('click', () => {
        activeImageMode = 'url';
        tabUrl.classList.add('active');
        tabFile.classList.remove('active');
        blockUrl.style.display = 'block';
        blockFile.style.display = 'none';
    });
    tabFile.addEventListener('click', () => {
        activeImageMode = 'file';
        tabFile.classList.add('active');
        tabUrl.classList.remove('active');
        blockUrl.style.display = 'none';
        blockFile.style.display = 'block';
    });
}

// ==========================================
// 4. DATA & REALTIME SYNC (SAVE / DELETE)
// ==========================================
const projectsGrid = document.getElementById('projects-grid');
const manageList = document.getElementById('manage-list');
const projCount = document.getElementById('proj-count');
const projectForm = document.getElementById('project-form');

// LocalStorage से प्रोजेक्ट्स लोड करना (ताकि रीलोड करने पर डिलीट न हों)
let localProjects = JSON.parse(localStorage.getItem('vault_projects')) || [
    { id: 1, title: 'Delivery Tracker', project_url: 'https://google.com', image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80', description: 'Live GPS location & shift tracking.' },
    { id: 2, title: 'Dil se Events', project_url: 'https://google.com', image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80', description: 'Event booking & management app.' },
    { id: 3, title: 'Business QR Code', project_url: 'https://google.com', image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80', description: 'Custom shaped contactless ordering.' }
];

async function loadAllProjects() {
    let projs = localProjects;

    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient.from('projects').select('*').order('id', { ascending: false });
            if (!error && data && data.length > 0) projs = data;
        } catch (e) {
            console.error('Supabase fetch error:', e);
        }
    }

    renderPublicGrid(projs);
    renderManageList(projs);
}

function renderPublicGrid(list) {
    if (!projectsGrid) return;
    projectsGrid.innerHTML = list.map(p => `
        <div class="project-card">
            <div class="card-img-wrap">
                <span class="tag-badge"># ${p.tag || 'AI BUILD'}</span>
                <img src="${p.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'}" alt="${p.title}" class="card-img">
            </div>
            <div class="card-body">
                <h3 class="card-title">${p.title}</h3>
                <p class="card-desc">${p.description || ''}</p>
                <a href="${p.project_url}" target="_blank" rel="noopener noreferrer" class="btn-open-live">
                    <span>Open Live Project</span>
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
            </div>
        </div>
    `).join('');
}

function renderManageList(list) {
    if (!manageList) return;
    if (projCount) projCount.innerText = list.length;

    manageList.innerHTML = list.map(p => `
        <div class="manage-item" data-id="${p.id}">
            <img src="${p.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80'}" class="manage-thumb" alt="${p.title}">
            <div class="manage-meta">
                <h5>${p.title}</h5>
                <p>${p.project_url}</p>
            </div>
            <button class="btn-delete-proj" onclick="deleteProject(${p.id})">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `).join('');
}

// नया प्रोजेक्ट सेव करना (फ़ाइल अपलोड सपोर्ट के साथ)
if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('form-name').value.trim();
        const url = document.getElementById('form-url').value.trim();
        const desc = document.getElementById('form-desc').value.trim();
        const imgUrlInput = document.getElementById('form-img-url').value.trim();
        const imgFileInput = document.getElementById('form-img-file');

        let finalImageUrl = imgUrlInput || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

        // अगर यूज़र ने "Upload Photo" से फ़ाइल चुनी है
        if (activeImageMode === 'file' && imgFileInput.files && imgFileInput.files[0]) {
            const file = imgFileInput.files[0];
            finalImageUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (uploadEvent) => resolve(uploadEvent.target.result);
                reader.readAsDataURL(file);
            });
        }

        const newObj = {
            title,
            project_url: url,
            description: desc,
            image_url: finalImageUrl,
            tag: 'AI BUILD'
        };

        if (supabaseClient) {
            const { error } = await supabaseClient.from('projects').insert([newObj]);
            if (error) alert('Error saving: ' + error.message);
        } else {
            newObj.id = Date.now();
            localProjects.unshift(newObj);
            localStorage.setItem('vault_projects', JSON.stringify(localProjects));
        }

        projectForm.reset();
        loadAllProjects();
    });
}

// प्रोजेक्ट डिलीट करना
window.deleteProject = async function(id) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    if (supabaseClient) {
        const { error } = await supabaseClient.from('projects').delete().eq('id', id);
        if (error) alert('Error deleting: ' + error.message);
    } else {
        localProjects = localProjects.filter(p => p.id !== id);
        localStorage.setItem('vault_projects', JSON.stringify(localProjects));
    }

    loadAllProjects();
};

function initRealtime() {
    if (!supabaseClient) return;
    supabaseClient
        .channel('public:projects')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
            loadAllProjects();
        })
        .subscribe();
}

window.addEventListener('DOMContentLoaded', () => {
    loadAllProjects();
    initRealtime();
});