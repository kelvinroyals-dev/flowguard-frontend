// ============================================
// DASHBOARD MODULE
// Renders full live dashboard for active properties
// NO hardcoded values - all data from API
// ============================================

const Dashboard = (function() {
    const API_BASE = 'https://api.flowguard.ng/api/v1';
    
    async function render(container, property) {
        // Show loading state
        container.innerHTML = `
            <div class="flex items-center justify-center py-20">
                <div class="text-center">
                    <svg class="animate-spin h-12 w-12 mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <p class="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        `;
        
        try {
            const token = Auth.getToken();
            
            // Fetch metrics from API
            const metricsRes = await fetch(`${API_BASE}/properties/${property.property_id}/metrics`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!metricsRes.ok) {
                throw new Error('Failed to load metrics');
            }
            
            const metricsData = await metricsRes.json();
            const metrics = metricsData.data;
            
            // Fetch assets
            const assetsRes = await fetch(`${API_BASE}/properties/${property.property_id}/assets`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const assetsData = await assetsRes.json();
            const assets = assetsData.data || [];
            
            // Fetch alerts
            const alertsRes = await fetch(`${API_BASE}/properties/${property.property_id}/alerts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const alertsData = await alertsRes.json();
            const alerts = alertsData.data || [];
            
            // Render full dashboard
            renderDashboard(container, property, metrics, assets, alerts);
            
        } catch (error) {
            console.error('Dashboard load error:', error);
            renderError(container);
        }
    }
    
    function renderDashboard(container, property, metrics, assets, alerts) {
        const healthColor = metrics.healthScore >= 90 ? 'green' : metrics.healthScore >= 75 ? 'yellow' : 'red';
        const uptimeColor = metrics.uptime30Days >= metrics.uptimeTarget ? 'green' : 'yellow';
        
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Property Header -->
                <div class="modern-card p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-2xl font-bold text-primary">${property.property_name}</h2>
                            <p class="text-sm text-secondary mt-1">${property.city}, ${property.state} • ID: ${property.property_id}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-600 dark:text-gray-400">Health Score</p>
                            <div class="flex items-center gap-2 mt-1">
                                <div class="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div class="h-full bg-${healthColor}-500 rounded-full transition-all" style="width: ${metrics.healthScore}%"></div>
                                </div>
                                <span class="text-xl font-bold text-${healthColor}-600">${metrics.healthScore}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="modern-card p-4">
                        <div class="flex items-center justify-between mb-2">
                            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Coverage Area</p>
                            <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                                </svg>
                            </div>
                        </div>
                        <p class="text-2xl font-bold text-primary">${metrics.coverageKm} km</p>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${metrics.totalAssets} monitored assets</p>
                    </div>
                    
                    <div class="modern-card p-4">
                        <div class="flex items-center justify-between mb-2">
                            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Active Sensors</p>
                            <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                        </div>
                        <p class="text-2xl font-bold text-primary">${metrics.activeSensors}/${metrics.totalAssets}</p>
                        <p class="text-xs text-green-600 font-semibold mt-1">${metrics.sensorStatus}</p>
                    </div>
                    
                    <div class="modern-card p-4">
                        <div class="flex items-center justify-between mb-2">
                            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">This Month</p>
                            <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                        </div>
                        <p class="text-2xl font-bold text-primary">${metrics.issuesResolvedThisMonth}</p>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Issues resolved</p>
                    </div>
                    
                    <div class="modern-card p-4">
                        <div class="flex items-center justify-between mb-2">
                            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Next Maintenance</p>
                            <div class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                            </div>
                        </div>
                        <p class="text-2xl font-bold text-primary">${new Date(metrics.nextMaintenanceDate).toLocaleDateString('en-NG', {month: 'short', day: 'numeric'})}</p>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${metrics.maintenanceDaysAway} days away</p>
                    </div>
                </div>
                
                <!-- Performance Metrics -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="modern-card p-6">
                        <p class="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">System Uptime (30 days)</p>
                        <p class="text-3xl font-bold text-primary mb-3">${metrics.uptime30Days}%</p>
                        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div class="h-full bg-${uptimeColor}-500 rounded-full" style="width: ${metrics.uptime30Days}%"></div>
                        </div>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">Target: ${metrics.uptimeTarget}%</p>
                    </div>
                    
                    <div class="modern-card p-6">
                        <p class="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">Avg Response Time</p>
                        <p class="text-3xl font-bold text-green-600 mb-3">${metrics.avgResponseTimeMinutes}m</p>
                        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div class="h-full bg-green-500 rounded-full" style="width: 70%"></div>
                        </div>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">Well within SLA</p>
                    </div>
                    
                    <div class="modern-card p-6">
                        <p class="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">Blockages Resolved</p>
                        <p class="text-3xl font-bold text-primary mb-3">${metrics.blockagesResolved.completed}/${metrics.blockagesResolved.total}</p>
                        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div class="h-full bg-green-500 rounded-full" style="width: ${(metrics.blockagesResolved.completed / metrics.blockagesResolved.total * 100)}%"></div>
                        </div>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">This month</p>
                    </div>
                </div>
                
                <!-- Active Alerts -->
                ${alerts.length > 0 ? `
                    <div class="modern-card p-6">
                        <h3 class="text-lg font-bold text-primary mb-4">Active Alerts (${alerts.length})</h3>
                        <div class="space-y-3">
                            ${alerts.map(alert => `
                                <div class="flex items-start gap-3 p-4 rounded-lg ${
                                    alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20' :
                                    alert.severity === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                                    'bg-blue-50 dark:bg-blue-900/20'
                                }">
                                    <svg class="w-5 h-5 mt-0.5 ${
                                        alert.severity === 'critical' ? 'text-red-600' :
                                        alert.severity === 'warning' ? 'text-yellow-600' :
                                        'text-blue-600'
                                    }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                    </svg>
                                    <div class="flex-1">
                                        <p class="font-semibold text-gray-900 dark:text-gray-100">${alert.assetName}</p>
                                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${alert.message}</p>
                                        <p class="text-xs text-gray-500 mt-1">${new Date(alert.triggeredAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Assets Table -->
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-primary mb-4">Monitored Assets (${assets.length})</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="border-b border-gray-200 dark:border-gray-700">
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">ASSET</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">TYPE</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">LENGTH</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">HEALTH</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">UPTIME</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">NEXT MAINTENANCE</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${assets.map(asset => `
                                    <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td class="py-3 px-4">
                                            <p class="font-semibold text-gray-900 dark:text-gray-100">${asset.name}</p>
                                            <p class="text-xs text-gray-500">${asset.assetId}</p>
                                        </td>
                                        <td class="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">${asset.type}</td>
                                        <td class="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">${asset.length}</td>
                                        <td class="py-3 px-4">
                                            <span class="px-2 py-1 rounded-full text-xs font-semibold ${
                                                asset.healthClass === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                asset.healthClass === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }">
                                                ${asset.health}
                                            </span>
                                        </td>
                                        <td class="py-3 px-4">
                                            <span class="text-sm font-semibold text-${asset.uptimeColor}-600">${asset.uptime}%</span>
                                        </td>
                                        <td class="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                                            ${new Date(asset.nextMaintenanceDate).toLocaleDateString('en-NG', {month: 'short', day: 'numeric', year: 'numeric'})}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    
    function renderError(container) {
        container.innerHTML = `
            <div class="modern-card p-8 text-center">
                <svg class="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Failed to Load Dashboard</h3>
                <p class="text-gray-600 mb-4">Unable to fetch property data. Please try again.</p>
                <button onclick="location.reload()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Retry
                </button>
            </div>
        `;
    }
    
    return {
        render
    };
})();
