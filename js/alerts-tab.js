// ============================================
// ALERTS & INCIDENTS TAB MODULE
// Handles Alerts tab rendering for all states
// ============================================

const AlertsTab = (function() {
    const API_BASE = 'https://api.flowguard.ng/api/v1';
    
    // ============================================
    // REAL DATA - Fetch from API
    // ============================================
    async function render(container, property) {
        container.innerHTML = `
            <div class="flex items-center justify-center py-20">
                <div class="text-center">
                    <svg class="animate-spin h-12 w-12 mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <p class="mt-4 text-gray-600 dark:text-gray-400">Loading alerts...</p>
                </div>
            </div>
        `;
        
        try {
            const token = Auth.getToken();
            const response = await fetch(`${API_BASE}/properties/${property.property_id}/alerts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load alerts');
            }
            
            const data = await response.json();
            const alerts = data.data || [];
            
            renderAlertsContent(container, property, alerts);
            
        } catch (error) {
            console.error('Alerts load error:', error);
            renderError(container);
        }
    }
    
    // ============================================
    // DEMO MODE - Show demo alerts
    // ============================================
    function renderDemo(container, property) {
        const demoAlerts = [
            {
                alert_id: 'ALT-001',
                asset_name: 'Service Road Drain',
                asset_id: 'SRD-003',
                severity: 'warning',
                type: 'water_level',
                message: 'Water level above normal threshold - monitoring',
                triggered_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                status: 'active'
            },
            {
                alert_id: 'ALT-002',
                asset_name: 'Main Perimeter Drain',
                asset_id: 'MPD-001',
                severity: 'info',
                type: 'maintenance_due',
                message: 'Scheduled maintenance approaching in 20 days',
                triggered_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active'
            },
            {
                alert_id: 'ALT-003',
                asset_name: 'Gate House Culvert',
                asset_id: 'GHC-002',
                severity: 'critical',
                type: 'blockage',
                message: 'Potential blockage detected - immediate attention required',
                triggered_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                resolved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'resolved'
            },
            {
                alert_id: 'ALT-004',
                asset_name: 'Residential Section Drain',
                asset_id: 'RSD-004',
                severity: 'success',
                type: 'maintenance_complete',
                message: 'Scheduled maintenance completed successfully',
                triggered_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                resolved_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'resolved'
            }
        ];
        
        renderAlertsContent(container, property, demoAlerts);
    }
    
    // ============================================
    // EMPTY STATE - System not deployed yet
    // ============================================
    function renderEmpty(container, property) {
        container.innerHTML = `
            <div class="max-w-2xl mx-auto py-20 text-center">
                <div class="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg class="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                    </svg>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Alerts Coming Soon</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6">
                    Real-time alerts and incident monitoring will be available once our sensors are deployed at <strong>${property.property_name}</strong>.
                </p>
                <div class="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-6 text-left">
                    <h4 class="font-bold text-amber-900 dark:text-amber-300 mb-3">What are Alerts?</h4>
                    <ul class="space-y-2 text-sm text-amber-800 dark:text-amber-400">
                        <li class="flex items-start gap-2">
                            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            <span>Instant notifications for blockages, overflows, and water level issues</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            <span>24/7 automated monitoring with severity levels</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            <span>Full incident history and response tracking</span>
                        </li>
                    </ul>
                </div>
                <button onclick="toggleDemoMode()" class="mt-8 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                    👁️ Preview with Demo Mode
                </button>
            </div>
        `;
    }
    
    // ============================================
    // SHARED RENDERING - Used by both real and demo
    // ============================================
    function renderAlertsContent(container, property, alerts) {
        const activeAlerts = alerts.filter(a => a.status === 'active');
        const resolvedAlerts = alerts.filter(a => a.status === 'resolved');
        
        const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
        const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;
        const infoCount = activeAlerts.filter(a => a.severity === 'info').length;
        
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold font-space text-primary">Alerts & Incidents</h2>
                        <p class="text-sm text-secondary mt-1">Real-time monitoring for <span class="font-semibold text-primary">${property.property_name}</span></p>
                    </div>
                </div>

                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="modern-card p-5">
                        <p class="text-xs font-medium text-secondary mb-2">Active Alerts</p>
                        <p class="text-3xl font-bold font-space text-primary">${activeAlerts.length}</p>
                        <p class="text-xs text-secondary mt-1">Require attention</p>
                    </div>
                    <div class="modern-card p-5">
                        <p class="text-xs font-medium text-secondary mb-2">Critical</p>
                        <p class="text-3xl font-bold font-space text-red-600">${criticalCount}</p>
                        <p class="text-xs text-secondary mt-1">High priority</p>
                    </div>
                    <div class="modern-card p-5">
                        <p class="text-xs font-medium text-secondary mb-2">Warnings</p>
                        <p class="text-3xl font-bold font-space text-yellow-600">${warningCount}</p>
                        <p class="text-xs text-secondary mt-1">Monitor closely</p>
                    </div>
                    <div class="modern-card p-5">
                        <p class="text-xs font-medium text-secondary mb-2">Resolved (30d)</p>
                        <p class="text-3xl font-bold font-space text-green-600">${resolvedAlerts.length}</p>
                        <p class="text-xs text-secondary mt-1">This month</p>
                    </div>
                </div>

                <!-- Active Alerts -->
                ${activeAlerts.length > 0 ? `
                    <div class="modern-card p-6">
                        <h3 class="text-sm font-bold text-primary mb-4">Active Alerts</h3>
                        <div class="space-y-3">
                            ${activeAlerts.map(alert => {
                                const severityConfig = {
                                    critical: { bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-500', text: 'text-red-700 dark:text-red-400', icon: 'M12 8v4m0 4h.01' },
                                    warning: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-500', text: 'text-yellow-700 dark:text-yellow-400', icon: 'M12 9v2m0 4h.01' },
                                    info: { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-400', icon: 'M13 16h-1v-4h-1m1-4h.01' }
                                };
                                const config = severityConfig[alert.severity] || severityConfig.info;
                                const timeAgo = getTimeAgo(alert.triggered_at);
                                
                                return `
                                    <div class="${config.bg} border-l-4 ${config.border} rounded-lg p-4">
                                        <div class="flex items-start gap-3">
                                            <svg class="w-5 h-5 ${config.text} flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${config.icon}M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                            <div class="flex-1">
                                                <div class="flex items-center justify-between mb-1">
                                                    <h4 class="font-bold ${config.text}">${alert.asset_name}</h4>
                                                    <span class="text-xs ${config.text} font-mono">${alert.asset_id}</span>
                                                </div>
                                                <p class="text-sm ${config.text} mb-2">${alert.message}</p>
                                                <div class="flex items-center gap-4 text-xs ${config.text}">
                                                    <span>📅 ${timeAgo}</span>
                                                    <span class="px-2 py-1 ${config.bg} border ${config.border} rounded font-semibold uppercase">${alert.severity}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="modern-card p-12 text-center">
                        <svg class="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">All Clear!</h3>
                        <p class="text-gray-600 dark:text-gray-400">No active alerts at this time</p>
                    </div>
                `}

                <!-- Recent History -->
                ${resolvedAlerts.length > 0 ? `
                    <div class="modern-card p-6">
                        <h3 class="text-sm font-bold text-primary mb-4">Recently Resolved</h3>
                        <div class="space-y-2">
                            ${resolvedAlerts.slice(0, 5).map(alert => {
                                const timeAgo = getTimeAgo(alert.resolved_at);
                                return `
                                    <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div class="flex items-center gap-3">
                                            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                            <div>
                                                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">${alert.asset_name}</p>
                                                <p class="text-xs text-gray-600 dark:text-gray-400">${alert.message}</p>
                                            </div>
                                        </div>
                                        <span class="text-xs text-gray-500 dark:text-gray-500">${timeAgo}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    function getTimeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    
    function renderError(container) {
        container.innerHTML = `
            <div class="modern-card p-8 text-center">
                <svg class="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Failed to Load Alerts</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">Unable to fetch alert data. Please try again.</p>
                <button onclick="location.reload()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Retry
                </button>
            </div>
        `;
    }
    
    return {
        render,
        renderDemo,
        renderEmpty
    };
})();