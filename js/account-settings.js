// ============================================
// ACCOUNT SETTINGS PAGE
// Full settings page for profile, properties, password, privacy
// ============================================

const AccountSettings = (function() {
    const API_BASE = 'https://api.flowguard.ng/api/v1';
    
    function render(container) {
        const user = Auth.getUser();
        const properties = StateManager.getAllProperties();
        
        container.innerHTML = `
            <div class="max-w-5xl mx-auto space-y-6">
                <!-- Header -->
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-primary">Account Settings</h2>
                        <p class="text-sm text-secondary mt-1">Manage your profile and preferences</p>
                    </div>
                    <button onclick="AccountSettings.close()" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <!-- Profile Section -->
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-primary mb-6">Profile Information</h3>
                    <form id="profile-form" class="space-y-6">
                        <div class="flex items-start gap-6">
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

                <!-- Properties Section -->
                ${properties && properties.length > 0 ? `
                    <div class="modern-card p-6">
                        <h3 class="text-lg font-bold text-primary mb-6">Your Properties</h3>
                        <div class="space-y-4">
                            ${properties.map((property, index) => `
                                <div class="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-600 transition-colors">
                                    <div class="flex items-center justify-between">
                                        <div class="flex-1">
                                            <h4 class="font-bold text-gray-900 dark:text-gray-100">${property.property_name}</h4>
                                            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${property.city}, ${property.state} • ${property.property_type?.replace(/_/g, ' ')}</p>
                                            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">ID: ${property.property_id}</p>
                                        </div>
                                        <button onclick="AccountSettings.editProperty('${property.property_id}')" class="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-sm font-medium">
                                            Edit Details
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Change Password Section -->
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-primary mb-6">Change Password</h3>
                    <form id="password-form" class="space-y-4 max-w-md">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Password *</label>
                            <input type="password" name="currentPassword" required
                                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password *</label>
                            <input type="password" name="newPassword" required minlength="8"
                                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">Minimum 8 characters</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm New Password *</label>
                            <input type="password" name="confirmPassword" required
                                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        </div>
                        
                        <button type="submit" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                            Update Password
                        </button>
                    </form>
                </div>

                <!-- Privacy & Notifications Section -->
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-primary mb-6">Privacy & Notifications</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                                <p class="font-semibold text-gray-900 dark:text-gray-100">Email Notifications</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Receive alerts and updates via email</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" checked>
                                <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        
                        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                                <p class="font-semibold text-gray-900 dark:text-gray-100">SMS Alerts</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Critical alerts via text message</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" checked>
                                <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        
                        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                                <p class="font-semibold text-gray-900 dark:text-gray-100">Weekly Reports</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">System health summary every week</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        
                        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                                <p class="font-semibold text-gray-900 dark:text-gray-100">Data Sharing</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400">Share anonymized data for improvements</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Danger Zone -->
                <div class="modern-card p-6 border-2 border-red-200 dark:border-red-900">
                    <h3 class="text-lg font-bold text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
                    <div class="space-y-3">
                        <button class="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 font-medium text-left">
                            Deactivate Account
                        </button>
                        <button class="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 font-medium text-left">
                            Delete Account Permanently
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Attach form handlers
        attachFormHandlers();
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
    
    function close() {
        // Return to dashboard
        switchTab('dashboard');
    }
    
    function getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    
    function showSuccess(message) {
        // Simple success message - can be enhanced
        const alert = document.createElement('div');
        alert.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        alert.textContent = message;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    }
    
    function showError(message) {
        const alert = document.createElement('div');
        alert.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        alert.textContent = message;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    }
    
    return {
        render,
        editProperty,
        closeEditModal,
        close
    };
})();