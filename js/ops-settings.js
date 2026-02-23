// ============================================
// SETTINGS MODULE
// System configuration and preferences
// ============================================

const OpsSettings = (function() {
    
    function render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
                    <p class="text-gray-600 dark:text-gray-400 mt-1">Configure system preferences and thresholds</p>
                </div>
                
                <!-- Demo Mode Toggle -->
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Development Settings</h3>
                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                            <p class="font-semibold text-gray-900 dark:text-gray-100">Demo Mode</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Use demo data instead of API</p>
                        </div>
                        <label class="relative inline-block w-12 h-6">
                            <input type="checkbox" id="demo-mode-toggle" ${OpsStateManager.getDemoMode() ? 'checked' : ''} 
                                onchange="OpsSettings.toggleDemoMode()" class="sr-only peer">
                            <div class="w-full h-full bg-gray-300 peer-checked:bg-blue-600 rounded-full peer transition-all cursor-pointer"></div>
                            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6"></div>
                        </label>
                    </div>
                </div>
                
                <!-- Alert Thresholds -->
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Alert Thresholds</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Critical Water Level (%)</label>
                            <input type="number" value="90" min="0" max="100"
                                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Warning Water Level (%)</label>
                            <input type="number" value="70" min="0" max="100"
                                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Auto-escalation Time (minutes)</label>
                            <input type="number" value="30" min="0"
                                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        </div>
                    </div>
                </div>
                
                <!-- Notification Settings -->
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Notification Settings</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div>
                                <p class="font-semibold text-gray-900 dark:text-gray-100">Email Notifications</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Send email alerts to operations team</p>
                            </div>
                            <label class="relative inline-block w-12 h-6">
                                <input type="checkbox" checked class="sr-only peer">
                                <div class="w-full h-full bg-gray-300 peer-checked:bg-blue-600 rounded-full peer transition-all cursor-pointer"></div>
                                <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6"></div>
                            </label>
                        </div>
                        
                        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div>
                                <p class="font-semibold text-gray-900 dark:text-gray-100">SMS Alerts</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Critical alerts via SMS</p>
                            </div>
                            <label class="relative inline-block w-12 h-6">
                                <input type="checkbox" checked class="sr-only peer">
                                <div class="w-full h-full bg-gray-300 peer-checked:bg-blue-600 rounded-full peer transition-all cursor-pointer"></div>
                                <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6"></div>
                            </label>
                        </div>
                    </div>
                </div>
                
                <!-- Company Information -->
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Company Information</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                            <input type="text" value="FlowGuard Nigeria"
                                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Contact Email</label>
                            <input type="email" value="ops@flowguard.ng"
                                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        </div>
                    </div>
                </div>
                
                <!-- Save Button -->
                <div class="flex justify-end">
                    <button onclick="OpsSettings.saveSettings()" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                        Save Settings
                    </button>
                </div>
            </div>
        `;
    }
    
    function toggleDemoMode() {
        const newMode = OpsStateManager.toggleDemoMode();
        showSuccess(`Demo mode ${newMode ? 'enabled' : 'disabled'}. Refreshing...`);
        setTimeout(() => location.reload(), 1000);
    }
    
    function saveSettings() {
        showSuccess('Settings saved successfully!');
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
        toggleDemoMode,
        saveSettings
    };
})();
