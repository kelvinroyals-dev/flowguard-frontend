// ============================================
// ALERTS MANAGEMENT MODULE
// Alert workflow and assignment
// ============================================

const OpsAlerts = (function() {
    
    const DEMO_ALERTS = [
        {
            alertId: 'ALT-001',
            severity: 'critical',
            type: 'Blockage Detected',
            location: 'Lekki Gardens - Sector D3',
            property: 'Lekki Gardens',
            timestamp: '2026-02-23T10:50:00Z',
            status: 'pending',
            assignedTeam: null
        },
        {
            alertId: 'ALT-002',
            severity: 'moderate',
            type: 'High Water Level',
            location: 'Banana Island - Main Drain',
            property: 'Banana Island Estate',
            timestamp: '2026-02-23T09:30:00Z',
            status: 'assigned',
            assignedTeam: 'Team Alpha'
        },
        {
            alertId: 'ALT-003',
            severity: 'minor',
            type: 'Slow Drainage',
            location: 'Eko Atlantic - Zone 2',
            property: 'Eko Atlantic City',
            timestamp: '2026-02-23T08:15:00Z',
            status: 'resolved',
            assignedTeam: 'Team Bravo'
        }
    ];
    
    function render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Live Alerts</h2>
                        <p class="text-gray-600 dark:text-gray-400 mt-1">Monitor and manage system alerts</p>
                    </div>
                </div>
                
                <!-- Alert Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="modern-card p-4">
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Critical</div>
                        <div class="text-3xl font-bold text-red-600">1</div>
                    </div>
                    <div class="modern-card p-4">
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Moderate</div>
                        <div class="text-3xl font-bold text-orange-600">1</div>
                    </div>
                    <div class="modern-card p-4">
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Minor</div>
                        <div class="text-3xl font-bold text-yellow-600">1</div>
                    </div>
                    <div class="modern-card p-4">
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Active</div>
                        <div class="text-3xl font-bold text-gray-900 dark:text-gray-100">3</div>
                    </div>
                </div>
                
                <!-- Alerts List -->
                <div class="modern-card p-6">
                    <div class="space-y-4" id="alerts-list">
                        <!-- Populated by JS -->
                    </div>
                </div>
            </div>
        `;
        
        renderAlertsList(DEMO_ALERTS);
    }
    
    function renderAlertsList(alerts) {
        const container = document.getElementById('alerts-list');
        if (!container) return;
        
        container.innerHTML = alerts.map(alert => `
            <div class="p-4 border-2 ${getSeverityBorder(alert.severity)} rounded-xl">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="px-3 py-1 ${getSeverityColor(alert.severity)} rounded-full text-xs font-bold uppercase">
                                ${alert.severity}
                            </span>
                            <span class="text-sm font-bold text-gray-900 dark:text-gray-100">${alert.type}</span>
                        </div>
                        <div class="text-sm text-gray-700 dark:text-gray-300 mb-1">
                            📍 ${alert.location}
                        </div>
                        <div class="text-xs text-gray-500">
                            ${alert.property} • ${formatDate(alert.timestamp)}
                        </div>
                    </div>
                    <div class="flex gap-2">
                        ${alert.status === 'pending' ? `
                            <button onclick="OpsAlerts.assignAlert('${alert.alertId}')" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                                Assign Team
                            </button>
                        ` : ''}
                        <button onclick="OpsAlerts.viewAlert('${alert.alertId}')" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
                            View
                        </button>
                    </div>
                </div>
                ${alert.assignedTeam ? `
                    <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div class="text-xs text-gray-600 dark:text-gray-400">
                            Assigned to: <span class="font-semibold">${alert.assignedTeam}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    function getSeverityBorder(severity) {
        const borders = {
            'critical': 'border-red-500',
            'moderate': 'border-orange-500',
            'minor': 'border-yellow-500'
        };
        return borders[severity] || 'border-gray-200';
    }
    
    function getSeverityColor(severity) {
        const colors = {
            'critical': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
            'moderate': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
            'minor': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
        };
        return colors[severity] || colors.minor;
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hours ago`;
        return date.toLocaleDateString();
    }
    
    function assignAlert(alertId) {
        console.log('Assign alert:', alertId);
    }
    
    function viewAlert(alertId) {
        console.log('View alert:', alertId);
    }
    
    return {
        render,
        assignAlert,
        viewAlert
    };
})();

// ============================================
// REPORTS MODULE
// Analytics and reporting
// ============================================

const OpsReports = (function() {
    
    function render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports & Analytics</h2>
                    <p class="text-gray-600 dark:text-gray-400 mt-1">Generate and export operational reports</p>
                </div>
                
                <!-- Report Types -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div class="modern-card p-6 cursor-pointer hover:border-blue-500 transition-colors" onclick="OpsReports.generateReport('daily')">
                        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                        </div>
                        <h3 class="font-bold text-gray-900 dark:text-gray-100 mb-2">Daily Operations Report</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Summary of today's activities</p>
                    </div>
                    
                    <div class="modern-card p-6 cursor-pointer hover:border-blue-500 transition-colors" onclick="OpsReports.generateReport('weekly')">
                        <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                        </div>
                        <h3 class="font-bold text-gray-900 dark:text-gray-100 mb-2">Weekly Performance</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Team and system metrics</p>
                    </div>
                    
                    <div class="modern-card p-6 cursor-pointer hover:border-blue-500 transition-colors" onclick="OpsReports.generateReport('financial')">
                        <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <h3 class="font-bold text-gray-900 dark:text-gray-100 mb-2">Financial Report</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Revenue and billing summary</p>
                    </div>
                </div>
                
                <!-- Recent Reports -->
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Reports</h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                                <div class="font-semibold text-gray-900 dark:text-gray-100">Daily Operations - Feb 22</div>
                                <div class="text-xs text-gray-500">Generated yesterday at 11:59 PM</div>
                            </div>
                            <button class="text-blue-600 hover:text-blue-700 text-sm font-medium">Download</button>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                                <div class="font-semibold text-gray-900 dark:text-gray-100">Weekly Performance - Week 8</div>
                                <div class="text-xs text-gray-500">Generated 2 days ago</div>
                            </div>
                            <button class="text-blue-600 hover:text-blue-700 text-sm font-medium">Download</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    function generateReport(type) {
        showSuccess(`Generating ${type} report...`);
        console.log('Generate report:', type);
    }
    
    function showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
    
    return {
        render,
        generateReport
    };
})();
