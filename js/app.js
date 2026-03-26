// ============================================
// MAIN APPLICATION CONTROLLER
// Orchestrates state-driven client portal
// ============================================

const App = (function() {
    const API_BASE = 'https://api.flowguard.ng/api/v1';
    let isDemoMode = false;
    
    // ============================================
    // INITIALIZE APPLICATION
    // ============================================
    async function init() {
        console.log(' Initializing Flow Guard Client Portal...');
        
        // Update user info in header
        Auth.updateUserInfo();
        
        // Load user data and determine state
        await loadAndRender();
        
        // Setup event listeners
        setupEventListeners();
        
        console.log(' Portal initialized');
    }
    
    // ============================================
    // LOAD DATA AND RENDER
    // ============================================
    async function loadAndRender() {
        const token = Auth.getToken();
        const container = document.getElementById('content-dashboard');
        
        if (!container) {
            console.error('Main content container not found');
            return;
        }
        
        // Show loading
        showLoading(container);
        
        try {
            let properties = [];
            let preferences = null;
            
            // Check localStorage for demo mode preference
            const savedDemoMode = localStorage.getItem('flowguard_demo_mode');
            isDemoMode = savedDemoMode === 'true';
            
            // Always load real data from API (demo mode only affects rendering)
            const [prefRes, propRes] = await Promise.all([
                fetch(`${API_BASE}/preferences`, { 
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null),  // Ignore 404 if endpoint doesn't exist
                fetch(`${API_BASE}/properties`, { 
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            
            if (prefRes && prefRes.ok) {
                const prefData = await prefRes.json();
                preferences = prefData.data;
                // Use API preference if available, otherwise use localStorage
                if (preferences?.show_demo_data !== undefined) {
                    isDemoMode = preferences.show_demo_data;
                }
            }
            
            if (propRes.ok) {
                const propData = await propRes.json();
                properties = propData.data || [];
            }
            
            // Initialize state manager with REAL properties
            const currentState = StateManager.init(properties, preferences);
            console.log(' Current state:', currentState);
            console.log(' Demo mode:', isDemoMode);
            
            // Update navigation visibility
            updateNavigation();
            
            // Update demo toggle visibility
            updateDemoToggle();
            
            // Update estate switcher
            updateEstateSwitcher();
            
            // Render appropriate view based on state
            renderCurrentState(container);
            
            // Render currently active tab (if not dashboard)
            const activeTab = document.querySelector('.tab-item.active');
            if (activeTab) {
                const tabName = activeTab.id.replace('tab-', '');
                if (tabName !== 'dashboard') {
                    const tabContainer = document.getElementById(`content-${tabName}`);
                    if (tabContainer && !tabContainer.classList.contains('hidden')) {
                        renderTab(tabName, tabContainer);
                    }
                }
            }
            
        } catch (error) {
            console.error('Failed to load data:', error);
            showError(container);
        }
    }
    
    // ============================================
    // RENDER BASED ON CURRENT STATE
    // ============================================
    function renderCurrentState(container) {
        const state = StateManager.getCurrentState();
        const property = StateManager.getCurrentProperty();
        
        console.log(' Rendering state:', state);
        console.log(' Demo mode:', isDemoMode);
        
        // Demo mode handling for pre-ACTIVE states
        // Show full dashboard with demo data (preview what portal will look like)
        if (isDemoMode && state !== StateManager.STATES.ACTIVE && property) {
            // User has property waiting for deployment + demo ON
            console.log(' Rendering demo dashboard for pre-ACTIVE state');
            Dashboard.renderDemo(container, property);
            return;
        }
        
        // Demo mode for NO_PROPERTY state
        if (isDemoMode && state === StateManager.STATES.NO_PROPERTY) {
            console.log(' Rendering demo dashboard for NO_PROPERTY state');
            const demoProperty = {
                property_id: 'DEMO-ESTATE-001',
                property_name: 'Palm Gardens Estate (Demo)',
                property_type: 'residential_estate',
                city: 'Lagos',
                state: 'Lagos'
            };
            Dashboard.renderDemo(container, demoProperty);
            return;
        }
        
        // Normal rendering based on state
        console.log(' Rendering normal view for state:', state);
        switch(state) {
            case StateManager.STATES.NO_PROPERTY:
                Onboarding.renderProgressHomepage(container);
                break;
                
            case StateManager.STATES.SUBMITTED:
            case StateManager.STATES.INSPECTION_SCHEDULED:
            case StateManager.STATES.INSPECTION_ONGOING:
                Onboarding.renderInspectionTracker(container, property);
                break;
                
            case StateManager.STATES.REPORT_READY:
                renderInspectionReport(container, property);
                break;
                
            case StateManager.STATES.QUOTE_SENT:
            case StateManager.STATES.PAYMENT_PENDING:
                Billing.renderServiceConfigurator(container, property);
                break;
                
            case StateManager.STATES.PAYMENT_COMPLETED:
            case StateManager.STATES.DEPLOYMENT_SCHEDULED:
                renderDeploymentPending(container, property);
                break;
                
            case StateManager.STATES.ACTIVE:
                Dashboard.render(container, property);
                break;
                
            default:
                Onboarding.renderProgressHomepage(container);
        }
    }
    
    // ============================================
    // INSPECTION REPORT VIEW
    // ============================================
    async function renderInspectionReport(container, property) {
        const token = Auth.getToken();
        
        try {
            const res = await fetch(`${API_BASE}/properties/${property.property_id}/inspection`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await res.json();
            const inspection = data.data;
            
            container.innerHTML = `
                <div class="max-w-4xl mx-auto">
                    <div class="modern-card p-8 mb-8 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800">
                        <h2 class="text-2xl font-bold text-primary mb-2">Inspection Report Ready! </h2>
                        <p class="text-secondary">Your site inspection has been completed. Review the findings below.</p>
                    </div>
                    
                    <div class="modern-card p-8 mb-8">
                        <h3 class="text-xl font-bold text-primary mb-4">Inspection Summary</h3>
                        <div class="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Overall Condition</p>
                                <p class="text-lg font-bold text-primary">${inspection.findings.overallCondition}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Critical Issues</p>
                                <p class="text-lg font-bold text-${inspection.findings.criticalIssues > 0 ? 'red' : 'green'}-600">${inspection.findings.criticalIssues}</p>
                            </div>
                        </div>
                        
                        <h4 class="font-bold text-primary mb-3">Recommendations</h4>
                        <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            ${inspection.findings.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                        
                        <a href="${API_BASE}${inspection.reportUrl}" target="_blank" class="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            Download Full Report (PDF)
                        </a>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Failed to load inspection:', error);
            container.innerHTML = '<div class="text-center text-red-600">Failed to load inspection report</div>';
        }
    }
    
    // ============================================
    // DEPLOYMENT PENDING VIEW
    // ============================================
    function renderDeploymentPending(container, property) {
        container.innerHTML = `
            <div class="max-w-4xl mx-auto">
                <div class="modern-card p-8 text-center">
                    <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center animate-pulse">
                        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                    <h2 class="text-2xl font-bold text-primary mb-4">Payment Received! </h2>
                    <p class="text-lg text-secondary mb-8">Your system deployment is being scheduled. You'll receive a confirmation within 48 hours.</p>
                    
                    <div class="max-w-md mx-auto text-left">
                        <h4 class="font-bold text-primary mb-4">What's Next?</h4>
                        <ol class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                            <li class="flex gap-2">
                                <span class="text-blue-600 font-bold">1.</span>
                                <span>Our technical team will prepare your equipment</span>
                            </li>
                            <li class="flex gap-2">
                                <span class="text-blue-600 font-bold">2.</span>
                                <span>We'll schedule an installation date with you</span>
                            </li>
                            <li class="flex gap-2">
                                <span class="text-blue-600 font-bold">3.</span>
                                <span>Installation typically takes 1-2 days</span>
                            </li>
                            <li class="flex gap-2">
                                <span class="text-blue-600 font-bold">4.</span>
                                <span>Your dashboard will go live immediately after</span>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ============================================
    // UI HELPERS
    // ============================================
    function showLoading(container) {
        container.innerHTML = `
            <div class="flex items-center justify-center py-20">
                <div class="text-center">
                    <svg class="animate-spin h-12 w-12 mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <p class="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        `;
    }
    
    function showError(container) {
        container.innerHTML = `
            <div class="modern-card p-8 text-center">
                <svg class="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Failed to Load</h3>
                <p class="text-gray-600 mb-4">Unable to load portal data. Please try again.</p>
                <button onclick="location.reload()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Retry
                </button>
            </div>
        `;
    }
    
    function updateNavigation() {
        const tabs = ['dashboard', 'assets', 'alerts-incidents', 'billing', 'support'];
        tabs.forEach(tab => {
            const tabEl = document.getElementById(`tab-${tab}`);
            if (tabEl) {
                if (StateManager.shouldShowTab(tab)) {
                    tabEl.classList.remove('hidden');
                } else {
                    tabEl.classList.add('hidden');
                }
            }
        });
    }
    
    function updateDemoToggle() {
        const container = document.getElementById('demo-toggle-container');
        if (container) {
            if (StateManager.shouldShowDemoToggle()) {
                container.classList.remove('hidden');
                container.classList.add('flex');
            } else {
                container.classList.add('hidden');
            }
        }
        
        const toggle = document.getElementById('demo-toggle');
        if (toggle) {
            toggle.checked = isDemoMode;
        }
    }
    
    function updateEstateSwitcher() {
        const properties = StateManager.getAllProperties();
        const currentProperty = StateManager.getCurrentProperty();
        const container = document.getElementById('estate-switcher-container');
        const menu = document.getElementById('estate-switcher-menu');
        const currentName = document.getElementById('current-estate-name');
        
        if (!container || !menu) return;
        
        // Show switcher if user has 2 or more properties
        if (properties && properties.length > 1) {
            container.classList.remove('hidden');
            
            // Update current property name
            if (currentProperty && currentName) {
                currentName.textContent = currentProperty.property_name;
            }
            
            // Populate menu with all properties
            menu.innerHTML = properties.map(prop => `
                <button onclick="App.switchToProperty('${prop.property_id}')" class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${prop.property_id === currentProperty?.property_id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            ${prop.property_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div class="flex-1">
                            <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">${prop.property_name}</p>
                            <p class="text-xs text-gray-600 dark:text-gray-400">${prop.property_type.replace(/_/g, ' ')}</p>
                        </div>
                        ${prop.property_id === currentProperty?.property_id ? `
                            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                            </svg>
                        ` : ''}
                    </div>
                </button>
            `).join('');
        } else {
            container.classList.add('hidden');
        }
    }
    
    function switchToProperty(propertyId) {
        const properties = StateManager.getAllProperties();
        const property = properties.find(p => p.property_id === propertyId);
        
        if (property) {
            StateManager.setCurrentProperty(property);
            
            // Close dropdown
            document.getElementById('estate-switcher-menu')?.classList.add('hidden');
            
            // Update UI
            updateEstateSwitcher();
            
            // Re-render current view
            const dashboardContainer = document.getElementById('content-dashboard');
            if (dashboardContainer && !dashboardContainer.classList.contains('hidden')) {
                renderCurrentState(dashboardContainer);
            }
            
            // Re-render currently visible tab
            const activeTab = document.querySelector('.tab-item.active');
            if (activeTab) {
                const tabName = activeTab.id.replace('tab-', '');
                if (tabName !== 'dashboard') {
                    const tabContainer = document.getElementById(`content-${tabName}`);
                    if (tabContainer && !tabContainer.classList.contains('hidden')) {
                        renderTab(tabName, tabContainer);
                    }
                }
            }
        }
    }
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    function setupEventListeners() {
        // Demo mode toggle
        const demoToggle = document.getElementById('demo-toggle');
        if (demoToggle) {
            demoToggle.addEventListener('change', async (e) => {
                isDemoMode = e.target.checked;
                
                // Save to localStorage (API endpoint doesn't exist yet)
                localStorage.setItem('flowguard_demo_mode', isDemoMode.toString());
                
                // Reload to apply changes
                await loadAndRender();
            });
        }
        
        // Tab switching
        const tabs = document.querySelectorAll('.tab-item');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active from all
                tabs.forEach(t => t.classList.remove('active'));
                // Add active to clicked
                this.classList.add('active');
            });
        });
    }
    
    // ============================================
    // TAB RENDERING - Dynamic content for tabs
    // ============================================
    function renderTab(tabName, container) {
        const state = StateManager.getCurrentState();
        const property = StateManager.getCurrentProperty();
        
        // Dashboard tab is handled by renderCurrentState
        if (tabName === 'dashboard') {
            return;
        }
        
        // Support tab is static HTML - no rendering needed
        if (tabName === 'support') {
            return;
        }
        
        console.log(` Rendering ${tabName} tab - Demo: ${isDemoMode}, State: ${state}`);
        
        // Assets Tab
        if (tabName === 'assets') {
            if (isDemoMode) {
                AssetsTab.renderDemo(container, property || { property_name: 'Demo Property' });
            } else if (state === StateManager.STATES.ACTIVE && property) {
                AssetsTab.render(container, property);
            } else if (property) {
                AssetsTab.renderEmpty(container, property);
            }
            return;
        }
        
        // Alerts & Incidents Tab
        if (tabName === 'alerts-incidents') {
            if (isDemoMode) {
                AlertsTab.renderDemo(container, property || { property_name: 'Demo Property' });
            } else if (state === StateManager.STATES.ACTIVE && property) {
                AlertsTab.render(container, property);
            } else if (property) {
                AlertsTab.renderEmpty(container, property);
            }
            return;
        }
        
        // Billing & SLA Tab
        if (tabName === 'billing') {
            if (isDemoMode) {
                BillingTab.renderDemo(container, property || { property_name: 'Demo Property' });
            } else if (state === StateManager.STATES.ACTIVE && property) {
                BillingTab.render(container, property);
            } else if (property) {
                BillingTab.renderEmpty(container, property);
            }
            return;
        }
    }
    
    return {
        init,
        loadAndRender,
        switchToProperty,
        renderTab
    };
})();

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
window.addEventListener('load', function() {
    App.init();
});