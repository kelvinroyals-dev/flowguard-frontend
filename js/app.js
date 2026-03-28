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
            
            // 404 means the inspection record hasn't been uploaded yet even though
            // the property status was set to report_ready. Show a waiting state.
            if (!res.ok) {
                renderInspectionPending(container, property);
                return;
            }
            
            const data = await res.json();
            const inspection = data.data;
            
            // Guard: if data shape is missing, fall back gracefully
            if (!inspection || !inspection.findings) {
                renderInspectionPending(container, property);
                return;
            }
            
            const recommendations = Array.isArray(inspection.findings.recommendations)
                ? inspection.findings.recommendations
                : [];
            const criticalIssues = inspection.findings.criticalIssues ?? 0;
            const overallCondition = inspection.findings.overallCondition || 'Under review';
            const reportUrl = inspection.reportUrl
                ? `${API_BASE}${inspection.reportUrl}`
                : null;
            
            container.innerHTML = `
                <div class="space-y-6">
                    <div class="notice ok">
                        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <div>
                            <strong>Inspection Report Ready</strong> — Your site inspection for <strong>${property.property_name}</strong> has been completed. Review the findings and download your report below.
                        </div>
                    </div>
                    
                    <div class="modern-card p-6">
                        <h3 class="font-space text-primary mb-5" style="font-size:1.05rem;font-weight:700;">Inspection Summary</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <p class="text-secondary" style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Overall Condition</p>
                                <p class="text-primary" style="font-size:1.1rem;font-weight:700;">${overallCondition}</p>
                            </div>
                            <div>
                                <p class="text-secondary" style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Critical Issues Found</p>
                                <p style="font-size:1.1rem;font-weight:700;color:${criticalIssues > 0 ? 'var(--err, #dc2626)' : 'var(--ok, #0a8a6a)'};">${criticalIssues}</p>
                            </div>
                        </div>
                        
                        ${recommendations.length > 0 ? `
                            <p class="text-secondary" style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Recommendations</p>
                            <ul style="display:flex;flex-direction:column;gap:6px;list-style:none;padding:0;">
                                ${recommendations.map(rec => `
                                    <li style="display:flex;align-items:flex-start;gap:8px;font-size:.85rem;color:var(--ink-2,#2d5068);">
                                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="flex-shrink:0;margin-top:2px;color:var(--blue,#16a8d3);">
                                            <path stroke-linecap="round" d="M9 5l7 7-7 7"/>
                                        </svg>
                                        ${rec}
                                    </li>
                                `).join('')}
                            </ul>
                        ` : ''}
                        
                        ${reportUrl ? `
                            <a href="${reportUrl}" target="_blank" rel="noopener noreferrer"
                               class="btn btn-primary" style="display:inline-flex;margin-top:20px;text-decoration:none;">
                                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                                Download Full Inspection Report (PDF)
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Failed to load inspection report:', error);
            renderInspectionPending(container, property);
        }
    }
    
    // Shown when inspection endpoint returns 404 or data is not yet available
    function renderInspectionPending(container, property) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="notice info">
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <div>Your inspection for <strong>${property.property_name}</strong> is complete. The report is being prepared and will appear here shortly.</div>
                </div>
                
                <div class="modern-card p-8 text-center">
                    <div style="width:56px;height:56px;border-radius:50%;background:rgba(22,168,211,.1);border:2px solid rgba(22,168,211,.25);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" style="color:var(--blue,#16a8d3);">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                    </div>
                    <h3 class="font-space text-primary" style="font-size:1.1rem;font-weight:700;margin-bottom:8px;">Inspection Report Being Prepared</h3>
                    <p class="text-secondary" style="font-size:.85rem;max-width:420px;margin:0 auto 20px;line-height:1.6;">
                        Your site inspection is complete. Our team is compiling the findings and the report will be available here within 24 hours.
                    </p>
                    <p class="text-secondary" style="font-size:.78rem;">Questions? Contact <a href="mailto:support@flowguard.ng" style="color:var(--blue,#16a8d3);">support@flowguard.ng</a> or call 020 1700 3062.</p>
                </div>
            </div>
        `;
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
        const tabs = ['dashboard', 'assets', 'monitoring', 'alerts-incidents', 'documents', 'invoices', 'billing', 'account', 'support'];
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
        
        // Assets Tab — always renders, fetches all properties internally
        if (tabName === 'assets') {
            AssetsTab.render(container, property || {});
            return;
        }
        
        // Alerts & Incidents Tab
        if (tabName === 'alerts-incidents') {
            if (isDemoMode) {
                AlertsTab.renderDemo(container, property || { property_name: 'Demo Property' });
            } else if (property) {
                AlertsTab.render(container, property);
            } else {
                AlertsTab.renderEmpty(container, { property_name: 'your property' });
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

        // Live Monitoring Tab — reuses AssetsTab sensor view
        if (tabName === 'monitoring') {
            if (isDemoMode) {
                AssetsTab.renderDemo(container, property || { property_name: 'Demo Property' });
            } else if (state === StateManager.STATES.ACTIVE && property) {
                AssetsTab.render(container, property);
            } else {
                container.innerHTML = `
                    <div class="sec-head">
                        <div><div class="sec-title">Live Monitoring</div>
                        <div class="sec-sub">Real-time sensor data from your drainage network</div></div>
                    </div>
                    <div class="card">
                        <div class="empty-state">
                            <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                            <h3>Monitoring not yet active</h3>
                            <p>Live sensor monitoring becomes available once your FlowGuard system is deployed and active.</p>
                        </div>
                    </div>`;
            }
            return;
        }

        // Invoices Tab
        if (tabName === 'invoices') {
            renderInvoicesTab(container, property);
            return;
        }

        // Account Tab — delegates to AccountSettings overlay
        if (tabName === 'account') {
            openAccountSettings();
            return;
        }
    }
    
    // ============================================
    // INVOICES TAB
    // ============================================
    async function renderInvoicesTab(container, property) {
        const token = Auth.getToken();

        container.innerHTML = `
            <div class="sec-head">
                <div><div class="sec-title">Invoices</div>
                <div class="sec-sub">Billing history for your FlowGuard service</div></div>
            </div>
            <div class="card">
                <div style="display:flex;align-items:center;justify-content:center;padding:40px 0;gap:9px;color:var(--ink-3);font-size:.82rem;">
                    <div class="fg-spin" style="width:17px;height:17px;flex-shrink:0;"></div>Loading invoices…
                </div>
            </div>`;

        try {
            if (!property) {
                container.querySelector('.card').innerHTML = `
                    <div class="empty-state">
                        <svg width="38" height="38" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        <h3>No property registered</h3>
                        <p>Register a property to view billing history.</p>
                    </div>`;
                return;
            }

            const res = await fetch(`${API_BASE}/properties/${property.property_id}/invoices`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const invoices = res.ok ? ((await res.json()).data || []) : [];

            if (invoices.length === 0) {
                container.querySelector('.card').innerHTML = `
                    <div class="empty-state">
                        <svg width="38" height="38" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        <h3>No invoices yet</h3>
                        <p>Invoices will appear here once your service is active.</p>
                    </div>`;
                return;
            }

            // Calculate summary
            const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
            const paid        = invoices.filter(i => i.status === 'paid');
            const totalOwed   = outstanding.reduce((s, i) => s + Number(i.balance_due || i.total_amount || 0), 0);
            const totalPaid   = paid.reduce((s, i) => s + Number(i.total_amount || 0), 0);
            const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

            const rows = invoices.map(inv => {
                const isOwed    = inv.status === 'sent' || inv.status === 'overdue';
                const isPaid    = inv.status === 'paid';
                const statusCls = isPaid ? 'nominal' : inv.status === 'overdue' ? 'critical' : 'watch';
                const statusLbl = isPaid ? 'Paid' : inv.status === 'overdue' ? 'Overdue' : 'Due';
                const dateStr   = inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '—';
                const dueStr    = inv.due_date  ? new Date(inv.due_date).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}) : '—';
                return `<tr>
                    <td class="bright" style="font-family:var(--ff-m);font-size:.76rem;">${inv.invoice_id||'—'}</td>
                    <td>${inv.description || ('Service — ' + property.property_name)}</td>
                    <td style="font-family:var(--ff-d);font-weight:800;color:var(--ink);">${fmt(inv.total_amount||0)}</td>
                    <td><span class="badge ${statusCls}">${statusLbl}</span></td>
                    <td style="font-family:var(--ff-m);font-size:.75rem;color:var(--ink-3);">${dateStr}</td>
                    <td style="font-family:var(--ff-m);font-size:.75rem;${isOwed?'color:var(--err);font-weight:700;':''}">${dueStr}</td>
                    <td>
                        ${isOwed ? '<button class="btn btn-primary btn-sm">Pay Now</button>' : ''}
                        ${isPaid ? '<button class="btn btn-ghost btn-sm">Receipt</button>' : ''}
                    </td>
                </tr>`;
            }).join('');

            container.innerHTML = `
                <div class="sec-head">
                    <div><div class="sec-title">Invoices</div>
                    <div class="sec-sub">Billing history for your FlowGuard service</div></div>
                </div>
                <div class="kpis" style="grid-template-columns:repeat(3,1fr);">
                    <div class="kpi red">
                        <div class="kpi-lbl">Outstanding</div>
                        <div class="kpi-val red">${fmt(totalOwed)}</div>
                        <div class="kpi-sub">${outstanding.length} invoice${outstanding.length!==1?'s':''} pending</div>
                    </div>
                    <div class="kpi blue">
                        <div class="kpi-lbl">Total Paid (YTD)</div>
                        <div class="kpi-val blue">${fmt(totalPaid)}</div>
                        <div class="kpi-sub">${paid.length} invoice${paid.length!==1?'s':''} cleared</div>
                    </div>
                    <div class="kpi green">
                        <div class="kpi-lbl">Account Status</div>
                        <div class="kpi-val green" style="font-size:1.4rem;">${totalOwed > 0 ? 'Payment Due' : 'Good Standing'}</div>
                        <div class="kpi-sub">${totalOwed > 0 ? 'Please settle outstanding balance' : 'No overdue balance'}</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-head">
                        <div class="card-title">All Invoices</div>
                        ${outstanding.length > 0 ? '<span class="badge critical">'+outstanding.length+' outstanding</span>' : '<span class="badge nominal">All clear</span>'}
                    </div>
                    <div class="inv-wrap">
                        <table class="inv-tbl">
                            <thead><tr>
                                <th>Invoice ID</th><th>Description</th><th>Amount</th>
                                <th>Status</th><th>Issue Date</th><th>Due Date</th><th></th>
                            </tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>`;

        } catch(e) {
            console.error('Invoices load error:', e);
            container.innerHTML = `
                <div class="sec-head"><div><div class="sec-title">Invoices</div></div></div>
                <div class="card"><div class="empty-state">
                    <svg width="38" height="38" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <h3>Failed to load invoices</h3>
                    <p>Please refresh the page or contact support if the problem persists.</p>
                </div></div>`;
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