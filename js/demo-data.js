// ============================================
// DEMO DATA COMPONENT
// Shows sample estate scenario for users to explore
// ============================================

function renderDemoData(container) {
    container.innerHTML = `
        <div class="max-w-7xl mx-auto">
            <!-- Demo Mode Banner -->
            <div class="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-8 mb-8 shadow-xl">
                <div class="flex items-start gap-6">
                    <div class="flex-shrink-0">
                        <div class="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <h2 class="text-2xl font-bold text-amber-900"> Demo Mode Active</h2>
                            <span class="px-3 py-1 bg-amber-200 text-amber-900 text-sm font-bold rounded-full">PREVIEW</span>
                        </div>
                        <p class="text-lg text-amber-800 mb-4">
                            You're viewing <strong>"Palm Gardens Estate"</strong> - a sample property showcasing Flow Guard's complete monitoring system.
                            This is demo data to help you understand our platform's capabilities.
                        </p>
                        <button onclick="disableDemoMode()"
                            class="px-6 py-3 bg-gradient-to-r from-[var(--cyan)] to-[var(--cyan-bright)] text-white font-bold rounded-xl hover:shadow-lg transition-all">
                             Register Your Property to See Real Data
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats Overview -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="glass rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-sm font-semibold text-gray-600">ACTIVE SENSORS</span>
                        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                    </div>
                    <p class="text-4xl font-bold text-gray-900 mb-1">12</p>
                    <p class="text-sm text-green-600 font-semibold">All systems operational</p>
                </div>

                <div class="glass rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-sm font-semibold text-gray-600">ACTIVE ALERTS</span>
                        <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                    </div>
                    <p class="text-4xl font-bold text-gray-900 mb-1">3</p>
                    <p class="text-sm text-yellow-600 font-semibold">Requires attention</p>
                </div>

                <div class="glass rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-sm font-semibold text-gray-600">AVG WATER LEVEL</span>
                        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
                            </svg>
                        </div>
                    </div>
                    <p class="text-4xl font-bold text-gray-900 mb-1">45<span class="text-2xl">%</span></p>
                    <p class="text-sm text-blue-600 font-semibold">Normal range</p>
                </div>

                <div class="glass rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-sm font-semibold text-gray-600">SYSTEM HEALTH</span>
                        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                        </div>
                    </div>
                    <p class="text-4xl font-bold text-gray-900 mb-1">98<span class="text-2xl">%</span></p>
                    <p class="text-sm text-green-600 font-semibold">Excellent</p>
                </div>
            </div>

            <!-- Main Dashboard -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Sensors List -->
                <div class="lg:col-span-2 space-y-6">
                    <div class="glass rounded-2xl p-8 shadow-lg">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-2xl font-bold text-gray-900">Sensor Status</h3>
                            <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all">
                                View Map
                            </button>
                        </div>

                        <div class="space-y-4">
                            ${renderDemoSensor('S-001', 'Main Entrance Drain', 42, 'normal', '2.3 L/s', 'Active')}
                            ${renderDemoSensor('S-002', 'Block A Drainage', 78, 'high', '4.1 L/s', 'Alert')}
                            ${renderDemoSensor('S-003', 'Central Collection', 35, 'normal', '5.8 L/s', 'Active')}
                            ${renderDemoSensor('S-004', 'Block B Drainage', 52, 'moderate', '3.2 L/s', 'Active')}
                            ${renderDemoSensor('S-005', 'Service Road Drain', 25, 'normal', '1.9 L/s', 'Active')}
                            ${renderDemoSensor('S-006', 'Parking Lot Drain', 88, 'critical', '0.8 L/s', 'Alert')}
                        </div>

                        <button onclick="viewAllSensors()" class="w-full mt-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-[var(--cyan-bright)] hover:text-[var(--cyan-bright)] transition-all">
                            View All 12 Sensors →
                        </button>
                    </div>

                    <!-- Recent Alerts -->
                    <div class="glass rounded-2xl p-8 shadow-lg">
                        <h3 class="text-2xl font-bold text-gray-900 mb-6">Recent Alerts</h3>
                        <div class="space-y-4">
                            ${renderDemoAlert('critical', 'High Water Level - Parking Lot', 'S-006 reporting 88% capacity', '15 min ago')}
                            ${renderDemoAlert('warning', 'Elevated Level - Block A', 'S-002 at 78% capacity', '1 hour ago')}
                            ${renderDemoAlert('info', 'Maintenance Reminder', 'Quarterly inspection due next week', '2 hours ago')}
                        </div>
                    </div>
                </div>

                <!-- Sidebar -->
                <div class="space-y-6">
                    <!-- Estate Info -->
                    <div class="glass rounded-xl p-6 shadow-lg">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-12 h-12 bg-gradient-to-br from-[var(--cyan)] to-[var(--cyan-bright)] rounded-xl flex items-center justify-center">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                </svg>
                            </div>
                            <div>
                                <h4 class="font-bold text-gray-900">Palm Gardens Estate</h4>
                                <p class="text-sm text-gray-600">Lekki, Lagos</p>
                            </div>
                        </div>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Total Area:</span>
                                <span class="font-semibold">75,000 sqm</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Units:</span>
                                <span class="font-semibold">180</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Sensors:</span>
                                <span class="font-semibold">12 Active</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Deployed:</span>
                                <span class="font-semibold">6 months ago</span>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="glass rounded-xl p-6 shadow-lg">
                        <h4 class="font-bold text-gray-900 mb-4">Quick Actions</h4>
                        <div class="space-y-2">
                            <button class="w-full px-4 py-3 bg-gradient-to-r from-[var(--cyan)] to-[var(--cyan-bright)] text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                                 View Full Dashboard
                            </button>
                            <button class="w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:border-[var(--cyan-bright)] transition-all">
                                 View Analytics
                            </button>
                            <button class="w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:border-[var(--cyan-bright)] transition-all">
                                 Download Reports
                            </button>
                        </div>
                    </div>

                    <!-- CTA Card -->
                    <div class="bg-gradient-to-br from-[var(--cyan)] to-[var(--cyan-bright)] rounded-xl p-6 text-white shadow-xl">
                        <h4 class="font-bold text-xl mb-2">Ready to protect your property?</h4>
                        <p class="text-blue-100 mb-4 text-sm">
                            Register your estate to get real-time monitoring and professional drainage management.
                        </p>
                        <button onclick="disableDemoMode()"
                            class="w-full px-6 py-3 bg-white text-[var(--cyan)] font-bold rounded-lg hover:bg-gray-50 transition-all">
                            Get Started →
                        </button>
                    </div>

                    <!-- Features List -->
                    <div class="glass rounded-xl p-6 shadow-lg">
                        <h4 class="font-bold text-gray-900 mb-4">This Demo Includes:</h4>
                        <ul class="space-y-2 text-sm">
                            ${renderFeature('12 IoT Sensors')}
                            ${renderFeature('Real-time Monitoring')}
                            ${renderFeature('Automated Alerts')}
                            ${renderFeature('Historical Analytics')}
                            ${renderFeature('Mobile Access')}
                            ${renderFeature('24/7 Support')}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Helper: Render demo sensor
function renderDemoSensor(id, name, level, severity, flow, status) {
    const severityColors = {
        normal: 'bg-green-100 text-green-700',
        moderate: 'bg-yellow-100 text-yellow-700',
        high: 'bg-orange-100 text-orange-700',
        critical: 'bg-red-100 text-red-700'
    };

    const levelColors = {
        normal: 'bg-green-500',
        moderate: 'bg-yellow-500',
        high: 'bg-orange-500',
        critical: 'bg-red-500'
    };

    return `
        <div class="flex items-center gap-4 p-4 border-2 border-gray-100 rounded-xl hover:border-[var(--cyan-bright)]/30 hover:shadow-md transition-all cursor-pointer">
            <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-700">
                    ${id.split('-')[1]}
                </div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-bold text-gray-900">${name}</h4>
                    <span class="px-2 py-0.5 ${severityColors[severity]} text-xs font-semibold rounded-full">${status}</span>
                </div>
                <div class="flex items-center gap-4 text-sm text-gray-600">
                    <span>ID: ${id}</span>
                    <span>Flow: ${flow}</span>
                </div>
            </div>
            <div class="flex-shrink-0 text-right">
                <p class="text-2xl font-bold text-gray-900">${level}%</p>
                <div class="w-20 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div class="${levelColors[severity]} h-full rounded-full transition-all" style="width: ${level}%"></div>
                </div>
            </div>
        </div>
    `;
}

// Helper: Render demo alert
function renderDemoAlert(type, title, description, time) {
    const alertIcons = {
        critical: { icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'text-red-500 bg-red-50' },
        warning: { icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-yellow-500 bg-yellow-50' },
        info: { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-blue-500 bg-blue-50' }
    };

    const alert = alertIcons[type];

    return `
        <div class="flex gap-4 p-4 border-2 border-gray-100 rounded-xl hover:shadow-md transition-all cursor-pointer">
            <div class="flex-shrink-0">
                <div class="w-10 h-10 ${alert.color} rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 ${alert.color.split(' ')[0]}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${alert.icon}"/>
                    </svg>
                </div>
            </div>
            <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                    <h4 class="font-bold text-gray-900">${title}</h4>
                    <span class="text-xs text-gray-500">${time}</span>
                </div>
                <p class="text-sm text-gray-600">${description}</p>
            </div>
        </div>
    `;
}

// Helper: Render feature
function renderFeature(text) {
    return `
        <li class="flex items-center gap-2">
            <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
            <span class="text-gray-700">${text}</span>
        </li>
    `;
}

// Toggle demo mode off
async function disableDemoMode() {
    demoMode = false;
    updateDemoToggle();

    const token = localStorage.getItem('token');
    try {
        await fetch(`${API_BASE}/preferences`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ showDemoData: false })
        });
    } catch(e) {
        console.error('Failed to save preference:', e);
    }

    renderMainContent();
}

function viewAllSensors() {
    showToast('Full sensor map is coming soon.', 'info');
}

// ============================================
// DEMO DATA MODULE
// Provides demo estate data for preview mode
// ============================================
const DemoData = (function() {
    const demoEstates = [
        {
            property_id: 'DEMO-ESTATE-001',
            property_name: 'Palm Gardens Estate (Demo)',
            property_type: 'residential_estate',
            city: 'Lagos',
            state: 'Lagos',
            status: 'active',
            created_at: new Date().toISOString()
        },
        {
            property_id: 'DEMO-ESTATE-002',
            property_name: 'Lakeside Residences (Demo)',
            property_type: 'residential_estate',
            city: 'Lagos',
            state: 'Lagos',
            status: 'active',
            created_at: new Date().toISOString()
        }
    ];

    let currentEstateIndex = 0;

    function getCurrentEstate() {
        return demoEstates[currentEstateIndex];
    }

    function getEstates() {
        return demoEstates;
    }

    function setCurrentEstate(index) {
        if (index >= 0 && index < demoEstates.length) {
            currentEstateIndex = index;
        }
    }

    return {
        getCurrentEstate,
        getEstates,
        setCurrentEstate
    };
})();