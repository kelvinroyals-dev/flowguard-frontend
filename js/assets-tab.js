// ============================================
// ASSETS TAB MODULE
// Handles Assets tab rendering for all states
// ============================================

const AssetsTab = (function() {
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
                    <p class="mt-4 text-gray-600 dark:text-gray-400">Loading assets...</p>
                </div>
            </div>
        `;
        
        try {
            const token = Auth.getToken();
            const response = await fetch(`${API_BASE}/properties/${property.property_id}/assets`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load assets');
            }
            
            const data = await response.json();
            const assets = data.data || [];
            
            renderAssetsContent(container, property, assets);
            
        } catch (error) {
            console.error('Assets load error:', error);
            renderError(container);
        }
    }
    
    // ============================================
    // DEMO MODE - Show demo assets
    // ============================================
    function renderDemo(container, property) {
        const demoAssets = [
            {
                asset_id: 'MPD-001',
                name: 'Main Perimeter Drain',
                type: 'Open Drain',
                length_meters: 850,
                health_score: 95,
                status: 'operational',
                last_maintenance: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                next_maintenance: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                asset_id: 'GHC-002',
                name: 'Gate House Culvert',
                type: 'Culvert',
                length_meters: 120,
                health_score: 88,
                status: 'operational',
                last_maintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                next_maintenance: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                asset_id: 'SRD-003',
                name: 'Service Road Drain',
                type: 'Open Drain',
                length_meters: 450,
                health_score: 72,
                status: 'needs_attention',
                last_maintenance: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                next_maintenance: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                asset_id: 'RSD-004',
                name: 'Residential Section Drain',
                type: 'Covered Drain',
                length_meters: 650,
                health_score: 91,
                status: 'operational',
                last_maintenance: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                next_maintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        renderAssetsContent(container, property, demoAssets);
    }
    
    // ============================================
    // EMPTY STATE - System not deployed yet
    // ============================================
    function renderEmpty(container, property) {
        container.innerHTML = `
            <div class="max-w-2xl mx-auto py-20 text-center">
                <div class="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg class="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Assets Coming Soon</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6">
                    Your asset inventory will be available once our team completes the site inspection and system deployment for <strong>${property.property_name}</strong>.
                </p>
                <div class="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 text-left">
                    <h4 class="font-bold text-blue-900 dark:text-blue-300 mb-3">What are Assets?</h4>
                    <ul class="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                        <li class="flex items-start gap-2">
                            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            <span>Drains, culverts, and channels in your property</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            <span>Real-time health monitoring and condition scores</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            <span>Maintenance schedules and service history</span>
                        </li>
                    </ul>
                </div>
                <button onclick="toggleDemoMode()" class="mt-8 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                    ️ Preview with Demo Mode
                </button>
            </div>
        `;
    }
    
    // ============================================
    // SHARED RENDERING - Used by both real and demo
    // ============================================
    function renderAssetsContent(container, property, assets) {
        const totalAssets = assets.length;
        const avgHealth = totalAssets > 0 
            ? Math.round(assets.reduce((sum, a) => sum + (a.health_score || 0), 0) / totalAssets) 
            : 0;
        
        // Find next maintenance
        let nextMaintenance = '--';
        if (assets.length > 0) {
            const upcoming = assets
                .filter(a => a.next_maintenance)
                .sort((a, b) => new Date(a.next_maintenance) - new Date(b.next_maintenance));
            
            if (upcoming.length > 0) {
                const days = Math.ceil((new Date(upcoming[0].next_maintenance) - new Date()) / (1000 * 60 * 60 * 24));
                nextMaintenance = days > 0 ? `${days} days` : 'Overdue';
            }
        }
        
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold font-space text-primary">My Assets</h2>
                        <p class="text-sm text-secondary mt-1">Drainage infrastructure for <span class="font-semibold text-primary">${property.property_name}</span></p>
                    </div>
                    <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Report Issue
                    </button>
                </div>

                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="modern-card p-5">
                        <p class="text-xs font-medium text-secondary mb-2">Total Assets</p>
                        <p class="text-3xl font-bold font-space text-primary">${totalAssets}</p>
                        <p class="text-xs text-secondary mt-1">Monitored infrastructure</p>
                    </div>
                    <div class="modern-card p-5">
                        <p class="text-xs font-medium text-secondary mb-2">Health Status</p>
                        <p class="text-3xl font-bold font-space ${avgHealth >= 80 ? 'text-green-600' : avgHealth >= 60 ? 'text-yellow-600' : 'text-red-600'}">${avgHealth}%</p>
                        <p class="text-xs text-secondary mt-1">Average condition</p>
                    </div>
                    <div class="modern-card p-5">
                        <p class="text-xs font-medium text-secondary mb-2">Next Maintenance</p>
                        <p class="text-3xl font-bold font-space text-primary">${nextMaintenance}</p>
                        <p class="text-xs text-secondary mt-1">Scheduled service</p>
                    </div>
                </div>

                <!-- Assets Table -->
                <div class="modern-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-sm font-bold text-primary">Infrastructure Assets</h3>
                        <div class="flex gap-2">
                            <button class="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-medium">Filter</button>
                            <button class="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-medium">Export CSV</button>
                        </div>
                    </div>
                    
                    ${assets.length > 0 ? `
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead class="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Asset ID</th>
                                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Name</th>
                                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Type</th>
                                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Length</th>
                                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Health</th>
                                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Status</th>
                                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Next Service</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                    ${assets.map(asset => {
                                        const healthColor = asset.health_score >= 80 ? 'green' : asset.health_score >= 60 ? 'yellow' : 'red';
                                        const statusClass = asset.status === 'operational' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
                                        const nextService = asset.next_maintenance 
                                            ? new Date(asset.next_maintenance).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
                                            : '--';
                                        
                                        return `
                                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td class="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">${asset.asset_id}</td>
                                                <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">${asset.name}</td>
                                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">${asset.type}</td>
                                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">${asset.length_meters}m</td>
                                                <td class="px-4 py-3">
                                                    <div class="flex items-center gap-2">
                                                        <div class="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                            <div class="bg-${healthColor}-600 h-2 rounded-full" style="width: ${asset.health_score}%"></div>
                                                        </div>
                                                        <span class="text-sm font-semibold text-${healthColor}-600">${asset.health_score}%</span>
                                                    </div>
                                                </td>
                                                <td class="px-4 py-3">
                                                    <span class="inline-block px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                                                        ${asset.status.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">${nextService}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="text-center py-12">
                            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                            </svg>
                            <p class="text-gray-600 dark:text-gray-400">No assets found</p>
                        </div>
                    `}
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
                <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Failed to Load Assets</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">Unable to fetch asset data. Please try again.</p>
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

// Helper function for demo toggle button in empty state
function toggleDemoMode() {
    const toggle = document.getElementById('demo-toggle');
    if (toggle) {
        toggle.checked = !toggle.checked;
        toggle.dispatchEvent(new Event('change'));
    }
}