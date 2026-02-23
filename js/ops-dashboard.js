// ============================================
// DASHBOARD MODULE
// Overview KPIs and quick stats
// ============================================

const OpsDashboard = (function() {
    
    function render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Top KPIs -->
                <div id="kpis-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <!-- Populated by JS -->
                </div>
                
                <!-- Quick Stats Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- System Health -->
                    <div class="modern-card p-6">
                        <h3 class="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">System Health</h3>
                        <div id="system-health" class="space-y-4">
                            <!-- Populated by JS -->
                        </div>
                    </div>
                    
                    <!-- Recent Activity -->
                    <div class="modern-card p-6">
                        <h3 class="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h3>
                        <div id="recent-activity" class="space-y-3">
                            <!-- Populated by JS -->
                        </div>
                    </div>
                    
                    <!-- Alert Distribution -->
                    <div class="modern-card p-6">
                        <h3 class="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Alert Distribution</h3>
                        <div id="alert-distribution" class="space-y-4">
                            <!-- Populated by JS -->
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button onclick="switchTab('team-members'); OpsUserManagement.openInviteModal();" class="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-600 dark:hover:border-blue-500 transition-colors text-left group">
                            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors">
                                <svg class="w-6 h-6 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                </svg>
                            </div>
                            <h4 class="font-bold text-gray-900 dark:text-gray-100 mb-1">Invite Team Member</h4>
                            <p class="text-xs text-gray-600 dark:text-gray-400">Add new user to operations</p>
                        </button>
                        
                        <button onclick="switchTab('clients'); OpsClients.openAddClientModal();" class="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-600 dark:hover:border-green-500 transition-colors text-left group">
                            <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-600 transition-colors">
                                <svg class="w-6 h-6 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                </svg>
                            </div>
                            <h4 class="font-bold text-gray-900 dark:text-gray-100 mb-1">Add New Client</h4>
                            <p class="text-xs text-gray-600 dark:text-gray-400">Onboard a new client</p>
                        </button>
                        
                        <button onclick="switchTab('alerts');" class="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-600 dark:hover:border-orange-500 transition-colors text-left group">
                            <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-600 transition-colors">
                                <svg class="w-6 h-6 text-orange-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                </svg>
                            </div>
                            <h4 class="font-bold text-gray-900 dark:text-gray-100 mb-1">View Live Alerts</h4>
                            <p class="text-xs text-gray-600 dark:text-gray-400">Manage active alerts</p>
                        </button>
                        
                        <button onclick="switchTab('reports');" class="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-600 dark:hover:border-purple-500 transition-colors text-left group">
                            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-600 transition-colors">
                                <svg class="w-6 h-6 text-purple-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                            </div>
                            <h4 class="font-bold text-gray-900 dark:text-gray-100 mb-1">Generate Report</h4>
                            <p class="text-xs text-gray-600 dark:text-gray-400">View analytics reports</p>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        loadDashboardData();
    }
    
    async function loadDashboardData() {
        const kpis = await OpsStateManager.loadKPIs();
        renderKPIs(kpis);
        renderSystemHealth(kpis);
        renderRecentActivity();
        renderAlertDistribution();
    }
    
    function renderKPIs(kpis) {
        const grid = document.getElementById('kpis-grid');
        if (!grid || !kpis) return;
        
        grid.innerHTML = `
            <!-- Active Clients -->
            <div class="modern-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                    </div>
                </div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Active Clients</p>
                <p class="text-4xl font-bold text-gray-900 dark:text-gray-100">${kpis.activeClients}</p>
                <p class="text-xs text-green-600 dark:text-green-400 mt-2 font-semibold">+${kpis.newClientsThisMonth} this month</p>
            </div>
            
            <!-- MRR -->
            <div class="modern-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                        <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                </div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Monthly Recurring Revenue</p>
                <p class="text-4xl font-bold text-gray-900 dark:text-gray-100">₦${(kpis.mrr / 1000000).toFixed(1)}M</p>
                <p class="text-xs text-green-600 dark:text-green-400 mt-2 font-semibold">+${kpis.mrrGrowth}% vs last month</p>
            </div>
            
            <!-- Coverage -->
            <div class="modern-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                        <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                        </svg>
                    </div>
                </div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Coverage Area</p>
                <p class="text-4xl font-bold text-gray-900 dark:text-gray-100">${kpis.totalCoverage} km</p>
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">Across Lagos</p>
            </div>
            
            <!-- Active Alerts -->
            <div class="modern-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                        <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                        </svg>
                    </div>
                </div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Active Alerts</p>
                <p class="text-4xl font-bold text-gray-900 dark:text-gray-100">${kpis.activeAlerts}</p>
                <p class="text-xs text-orange-600 dark:text-orange-400 mt-2 font-semibold">${kpis.criticalAlerts} critical</p>
            </div>
        `;
    }
    
    function renderSystemHealth(kpis) {
        const container = document.getElementById('system-health');
        if (!container || !kpis) return;
        
        container.innerHTML = `
            <div>
                <div class="flex justify-between text-xs mb-2">
                    <span class="text-gray-600 dark:text-gray-400">Network Uptime</span>
                    <span class="font-semibold text-gray-900 dark:text-gray-100">${kpis.networkUptime}%</span>
                </div>
                <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-green-500 to-green-600" style="width: ${kpis.networkUptime}%"></div>
                </div>
            </div>
            
            <div>
                <div class="flex justify-between text-xs mb-2">
                    <span class="text-gray-600 dark:text-gray-400">Sensors Online</span>
                    <span class="font-semibold text-gray-900 dark:text-gray-100">${kpis.sensorsOnline.online}/${kpis.sensorsOnline.total}</span>
                </div>
                <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-blue-500 to-blue-600" style="width: ${(kpis.sensorsOnline.online / kpis.sensorsOnline.total * 100).toFixed(1)}%"></div>
                </div>
            </div>
            
            <div>
                <div class="flex justify-between text-xs mb-2">
                    <span class="text-gray-600 dark:text-gray-400">Avg Response Time</span>
                    <span class="font-semibold text-gray-900 dark:text-gray-100">${kpis.avgResponseTime} min</span>
                </div>
                <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-purple-500 to-purple-600" style="width: 65%"></div>
                </div>
            </div>
        `;
    }
    
    function renderRecentActivity() {
        const container = document.getElementById('recent-activity');
        if (!container) return;
        
        const activities = [
            { type: 'client', icon: 'user-add', color: 'green', text: 'New client added: Parkview Estate', time: '10 min ago' },
            { type: 'alert', icon: 'alert', color: 'orange', text: 'Alert dispatched to Team Bravo', time: '25 min ago' },
            { type: 'team', icon: 'check', color: 'blue', text: 'Team Alpha completed job at Lekki', time: '1 hour ago' },
            { type: 'user', icon: 'mail', color: 'purple', text: 'Invite sent to sarah@ops.com', time: '2 hours ago' }
        ];
        
        container.innerHTML = activities.map(activity => `
            <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-${activity.color}-100 dark:bg-${activity.color}-900/30 flex items-center justify-center flex-shrink-0">
                    <div class="w-2 h-2 rounded-full bg-${activity.color}-600"></div>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-900 dark:text-gray-100">${activity.text}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-500">${activity.time}</p>
                </div>
            </div>
        `).join('');
    }
    
    function renderAlertDistribution() {
        const container = document.getElementById('alert-distribution');
        if (!container) return;
        
        const distribution = [
            { label: 'Critical', count: 12, total: 87, color: 'red' },
            { label: 'Moderate', count: 45, total: 87, color: 'orange' },
            { label: 'Minor', count: 30, total: 87, color: 'yellow' }
        ];
        
        container.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">Total Alerts This Week</span>
                <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">87</span>
            </div>
            
            ${distribution.map(item => `
                <div class="mb-3">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-xs text-gray-600 dark:text-gray-400">${item.label}</span>
                        <span class="text-sm font-bold text-${item.color}-600">${item.count}</span>
                    </div>
                    <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div class="h-full bg-${item.color}-500" style="width: ${(item.count / item.total * 100).toFixed(1)}%"></div>
                    </div>
                </div>
            `).join('')}
            
            <p class="text-xs text-gray-500 dark:text-gray-500 mt-4 text-center">14% decrease vs last week</p>
        `;
    }
    
    return {
        render
    };
})();
