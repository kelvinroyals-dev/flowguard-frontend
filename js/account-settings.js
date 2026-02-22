// ============================================
// ACCOUNT SETTINGS MODULE
// Manages user profile, password, privacy, and properties
// ============================================

const AccountSettings = (function() {
    const API_BASE = 'https://api.flowguard.ng/api/v1';
    
    let currentSection = 'profile';

    function render(container) {
        const user = Auth.getUser();
        const properties = StateManager.getAllProperties();

        container.innerHTML = `
            <div class="max-w-7xl mx-auto">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Account Settings</h2>
                        <p class="text-gray-600 dark:text-gray-400 mt-1">Manage your account and preferences</p>
                    </div>
                    <button onclick="AccountSettings.close()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <!-- Sidebar + Content Layout -->
                <div class="flex gap-6">
                    <!-- Left Sidebar -->
                    <div class="w-64 flex-shrink-0">
                        <div class="modern-card p-4 space-y-1">
                            <button onclick="AccountSettings.switchSection('profile')" 
                                class="settings-nav-item ${currentSection === 'profile' ? 'active' : ''}" data-section="profile">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                </svg>
                                <span>Profile</span>
                            </button>
                            
                            <button onclick="AccountSettings.switchSection('password')" 
                                class="settings-nav-item ${currentSection === 'password' ? 'active' : ''}" data-section="password">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>
                                <span>Password</span>
                            </button>
                            
                            <button onclick="AccountSettings.switchSection('privacy')" 
                                class="settings-nav-item ${currentSection === 'privacy' ? 'active' : ''}" data-section="privacy">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                                </svg>
                                <span>Privacy & Notifications</span>
                            </button>
                            
                            <button onclick="AccountSettings.switchSection('properties')" 
                                class="settings-nav-item ${currentSection === 'properties' ? 'active' : ''}" data-section="properties">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                </svg>
                                <span>Your Properties</span>
                            </button>
                            
                            <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                            
                            <button onclick="AccountSettings.switchSection('danger')" 
                                class="settings-nav-item ${currentSection === 'danger' ? 'active' : ''}" data-section="danger">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                                </svg>
                                <span>Danger Zone</span>
                            </button>
                        </div>
                    </div>

                    <!-- Right Content Area -->
                    <div class="flex-1">
                        <div id="settings-content-area">
                            ${renderSection(currentSection, user, properties)}
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .settings-nav-item {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    font-medium;
                    color: #6b7280;
                    transition: all 0.2s;
                    text-align: left;
                }
                
                .settings-nav-item:hover {
                    background: #f3f4f6;
                    color: #374151;
                }
                
                .dark .settings-nav-item {
                    color: #9ca3af;
                }
                
                .dark .settings-nav-item:hover {
                    background: #374151;
                    color: #e5e7eb;
                }
                
                .settings-nav-item.active {
                    background: #3b82f6;
                    color: white;
                }
                
                .dark .settings-nav-item.active {
                    background: #3b82f6;
                    color: white;
                }
            </style>
        `;

        attachFormHandlers();
    }

    function switchSection(section) {
        currentSection = section;
        const user = Auth.getUser();
        const properties = StateManager.getAllProperties();
        
        // Update nav items
        document.querySelectorAll('.settings-nav-item').forEach(item => {
            if (item.dataset.section === section) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Update content
        const contentArea = document.getElementById('settings-content-area');
        contentArea.innerHTML = renderSection(section, user, properties);
        
        attachFormHandlers();
    }

    function renderSection(section, user, properties) {
        switch(section) {
            case 'profile':
                return renderProfileSection(user);
            case 'password':
                return renderPasswordSection();
            case 'privacy':
                return renderPrivacySection();
            case 'properties':
                return renderPropertiesSection(properties);
            case 'danger':
                return renderDangerSection();
            default:
                return renderProfileSection(user);
        }
    }

    function renderProfileSection(user) {
        return `
            <div class="modern-card p-6">
                <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Profile Information</h3>
                
                <form id="profile-form">
                    <div class="flex gap-6 mb-6">
                        <!-- Avatar -->
                        <div class="flex-shrink-0">
                            <div class="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3">
                                ${getInitials(user?.fullName || 'User')}
                            </div>
                            <button type="button" class="text-xs text-blue-600 hover:text-blue-700 font-medium">Change Photo</button>
                        </div>
                        
                        <!-- Form Fields -->
                        <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                                <input type="text" name="fullName" value="${user?.fullName || ''}" required
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address *</label>
                                <input type="email" name="email" value="${user?.email || ''}" required
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                                <input type="tel" name="phone" value="${user?.phone || ''}"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Organization</label>
                                <input type="text" name="organization" value="${user?.organization || ''}"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end">
                        <button type="submit" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    function renderPasswordSection() {
        return `
            <div class="modern-card p-6">
                <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Change Password</h3>
                
                <form id="password-form" class="max-w-md">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Password *</label>
                            <input type="password" name="currentPassword" required
                                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password *</label>
                            <input type="password" name="newPassword" required minlength="8"
                                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 8 characters</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm New Password *</label>
                            <input type="password" name="confirmPassword" required minlength="8"
                                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        </div>
                        
                        <button type="submit" class="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    function renderPrivacySection() {
        return `
            <div class="modern-card p-6">
                <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Privacy & Notifications</h3>
                
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                            <p class="font-semibold text-gray-900 dark:text-gray-100">Email Notifications</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Receive updates via email</p>
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
                    
                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                            <p class="font-semibold text-gray-900 dark:text-gray-100">Weekly Reports</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Summary of weekly activity</p>
                        </div>
                        <label class="relative inline-block w-12 h-6">
                            <input type="checkbox" class="sr-only peer">
                            <div class="w-full h-full bg-gray-300 peer-checked:bg-blue-600 rounded-full peer transition-all cursor-pointer"></div>
                            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                            <p class="font-semibold text-gray-900 dark:text-gray-100">Data Sharing</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Share analytics with partners</p>
                        </div>
                        <label class="relative inline-block w-12 h-6">
                            <input type="checkbox" class="sr-only peer">
                            <div class="w-full h-full bg-gray-300 peer-checked:bg-blue-600 rounded-full peer transition-all cursor-pointer"></div>
                            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6"></div>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    function renderPropertiesSection(properties) {
        if (!properties || properties.length === 0) {
            return `
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Your Properties</h3>
                    <div class="text-center py-12">
                        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                        <p class="text-gray-600 dark:text-gray-400">No properties registered yet</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="modern-card p-6">
                <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Your Properties</h3>
                
                <div class="space-y-4">
                    ${properties.map(prop => `
                        <div class="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <h4 class="font-bold text-gray-900 dark:text-gray-100">${prop.property_name}</h4>
                                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${prop.city}, ${prop.state}</p>
                                    <div class="flex gap-4 mt-2 text-xs text-gray-500">
                                        <span>Type: ${formatPropertyType(prop.property_type)}</span>
                                        <span>ID: ${prop.property_id}</span>
                                    </div>
                                </div>
                                <button onclick="AccountSettings.editProperty('${prop.property_id}')" 
                                    class="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                    Edit Details
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function renderDangerSection() {
        return `
            <div class="modern-card p-6">
                <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Danger Zone</h3>
                
                <div class="space-y-4">
                    <div class="p-4 border-2 border-red-200 dark:border-red-900/50 rounded-xl bg-red-50 dark:bg-red-900/10">
                        <h4 class="font-bold text-gray-900 dark:text-gray-100 mb-2">Deactivate Account</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Temporarily disable your account. You can reactivate it anytime.</p>
                        <button class="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                            Deactivate Account
                        </button>
                    </div>
                    
                    <div class="p-4 border-2 border-red-300 dark:border-red-800 rounded-xl bg-red-100 dark:bg-red-900/20">
                        <h4 class="font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Account Permanently</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Once deleted, your account cannot be recovered. All data will be permanently removed.</p>
                        <button class="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function formatPropertyType(type) {
        return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
    }

    function getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    function attachFormHandlers() {
        // Profile form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(profileForm);
                const data = Object.fromEntries(formData);
                
                try {
                    const token = Auth.getToken();
                    const response = await fetch(`${API_BASE}/profile`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    if (response.ok) {
                        showSuccess('Profile updated successfully!');
                    } else {
                        showError('Failed to update profile');
                    }
                } catch (error) {
                    console.error('Profile update error:', error);
                    showError('Failed to update profile');
                }
            });
        }
        
        // Password form
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(passwordForm);
                const data = Object.fromEntries(formData);
                
                if (data.newPassword !== data.confirmPassword) {
                    showError('Passwords do not match');
                    return;
                }
                
                if (data.newPassword.length < 8) {
                    showError('Password must be at least 8 characters');
                    return;
                }
                
                try {
                    const token = Auth.getToken();
                    const response = await fetch(`${API_BASE}/password`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            currentPassword: data.currentPassword,
                            newPassword: data.newPassword
                        })
                    });
                    
                    if (response.ok) {
                        showSuccess('Password updated successfully!');
                        passwordForm.reset();
                    } else {
                        showError('Failed to update password');
                    }
                } catch (error) {
                    console.error('Password update error:', error);
                    showError('Failed to update password');
                }
            });
        }
    }

    function editProperty(propertyId) {
        const property = StateManager.getAllProperties().find(p => p.property_id === propertyId);
        if (!property) return;
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'property-edit-modal';
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="modern-card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Property Details</h3>
                    <button onclick="AccountSettings.closeEditModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <form id="property-edit-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Property Name *</label>
                        <input type="text" name="property_name" value="${property.property_name}" required
                            class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Property Type *</label>
                        <select name="property_type" required
                            class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            <option value="residential_estate" ${property.property_type === 'residential_estate' ? 'selected' : ''}>Residential Estate</option>
                            <option value="commercial_complex" ${property.property_type === 'commercial_complex' ? 'selected' : ''}>Commercial Complex</option>
                            <option value="industrial_facility" ${property.property_type === 'industrial_facility' ? 'selected' : ''}>Industrial Facility</option>
                            <option value="mixed_use" ${property.property_type === 'mixed_use' ? 'selected' : ''}>Mixed Use</option>
                            <option value="government_facility" ${property.property_type === 'government_facility' ? 'selected' : ''}>Government Facility</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</label>
                        <input type="text" name="address" value="${property.address || ''}"
                            class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City *</label>
                            <input type="text" name="city" value="${property.city}" required
                                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">State *</label>
                            <input type="text" name="state" value="${property.state}" required
                                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        </div>
                    </div>
                    
                    <div class="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <div class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <div class="text-sm text-blue-800 dark:text-blue-400">
                                <p class="font-semibold mb-1">Property ID: ${property.property_id}</p>
                                <p class="text-xs">Status: ${property.status}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 pt-4">
                        <button type="button" onclick="AccountSettings.closeEditModal()" class="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = document.getElementById('property-edit-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            try {
                const token = Auth.getToken();
                const response = await fetch(`${API_BASE}/properties/${propertyId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    showSuccess('Property updated successfully!');
                    closeEditModal();
                    
                    // Reload to refresh property list
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    showError('Failed to update property');
                }
            } catch (error) {
                console.error('Property update error:', error);
                showError('Failed to update property');
            }
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEditModal();
            }
        });
        
        // Close on escape
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeEditModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
    
    function closeEditModal() {
        const modal = document.getElementById('property-edit-modal');
        if (modal) {
            modal.remove();
        }
    }

    function showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function showError(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function close() {
        switchTab('dashboard');
    }

    return {
        render,
        switchSection,
        editProperty,
        closeEditModal,
        close
    };
})();