// ============================================
// ONBOARDING INTEGRATION SCRIPT
// Bridges old client portal with new onboarding flow
// ============================================

// Global state
let currentUser = null;
let userProperties = [];
let userPreferences = null;
let demoMode = false;

const API_BASE = 'https://api.flowguard.ng/api/v1';

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
(async function initOnboarding() {
    console.log('🚀 Initializing onboarding system...');
    
    // Get user info from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
        currentUser = JSON.parse(userStr);
        console.log('👤 Current user:', currentUser);
    }
    
    // Load user data
    await loadUserData();
    
    // Override the dashboard tab to show onboarding
    const dashboardTab = document.getElementById('tab-dashboard');
    if (dashboardTab) {
        dashboardTab.addEventListener('click', showOnboardingDashboard);
        
        // Auto-show onboarding dashboard on load
        setTimeout(() => {
            showOnboardingDashboard();
        }, 500);
    }
    
    console.log('✅ Onboarding system initialized');
})();

// ============================================
// LOAD USER DATA FROM API
// ============================================
async function loadUserData() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        console.log('📥 Loading user data from API...');
        
        // Load preferences
        const prefRes = await fetch(`${API_BASE}/preferences`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (prefRes.ok) {
            const prefData = await prefRes.json();
            userPreferences = prefData.data;
            demoMode = userPreferences.show_demo_data || false;
            console.log('⚙️ Preferences loaded:', userPreferences);
        }
        
        // Load properties
        const propRes = await fetch(`${API_BASE}/properties`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (propRes.ok) {
            const propData = await propRes.json();
            userProperties = propData.data || [];
            console.log(`🏠 Loaded ${userProperties.length} properties`);
        }
        
    } catch (error) {
        console.error('❌ Failed to load data:', error);
    }
}

// ============================================
// SHOW ONBOARDING DASHBOARD
// ============================================
function showOnboardingDashboard() {
    console.log('📊 Showing onboarding dashboard...');
    
    // Hide all old content sections
    const contentSections = document.querySelectorAll('[id^="content-"]');
    contentSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Get or create main content container
    let mainContent = document.getElementById('onboarding-main-content');
    if (!mainContent) {
        mainContent = document.createElement('div');
        mainContent.id = 'onboarding-main-content';
        mainContent.className = 'max-w-7xl mx-auto px-6 py-8';
        
        // Insert after header
        const app = document.getElementById('main-app') || document.body;
        const header = app.querySelector('header');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(mainContent, header.nextSibling);
        } else {
            app.appendChild(mainContent);
        }
    }
    
    mainContent.style.display = 'block';
    
    // Render appropriate content
    renderMainContent(mainContent);
}

// ============================================
// RENDER MAIN CONTENT
// ============================================
function renderMainContent(container) {
    console.log('🎨 Rendering content...', {
        demoMode,
        propertiesCount: userProperties.length
    });
    
    // If demo mode is on, show demo data
    if (demoMode) {
        console.log('🎭 Rendering demo data');
        renderDemoData(container);
        return;
    }
    
    // If user has no properties, show property registration
    if (userProperties.length === 0) {
        console.log('📝 Rendering property registration form');
        renderPropertyRegistration(container);
        return;
    }
    
    // If user has properties, show dashboard
    const mainProperty = userProperties[0];
    console.log('📊 Rendering property dashboard for:', mainProperty.property_name);
    renderPropertyDashboard(container, mainProperty);
}

// ============================================
// DEMO MODE TOGGLE (if needed)
// ============================================
function toggleDemoMode() {
    demoMode = !demoMode;
    
    // Save preference
    const token = localStorage.getItem('token');
    if (token) {
        fetch(`${API_BASE}/preferences`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ showDemoData: demoMode })
        }).catch(e => console.error('Failed to save preference:', e));
    }
    
    // Re-render
    const container = document.getElementById('onboarding-main-content');
    if (container) {
        renderMainContent(container);
    }
}

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================
window.toggleDemoMode = toggleDemoMode;
window.refreshOnboardingData = async function() {
    await loadUserData();
    showOnboardingDashboard();
};

console.log('📦 Onboarding integration loaded');
