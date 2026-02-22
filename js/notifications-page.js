// ============================================
// NOTIFICATIONS PAGE
// Full notifications center with filters and actions
// ============================================

const NotificationsPage = (function() {
    const API_BASE = 'https://api.flowguard.ng/api/v1';
    let allNotifications = [];
    let currentFilter = 'all'; // all, unread, read, alerts, system
    
    async function render(container) {
        // Show loading
        container.innerHTML = `
            <div class="flex items-center justify-center py-20">
                <div class="text-center">
                    <svg class="animate-spin h-12 w-12 mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <p class="mt-4 text-gray-600 dark:text-gray-400">Loading notifications...</p>
                </div>
            </div>
        `;
        
        try {
            const token = Auth.getToken();
            const response = await fetch(`${API_BASE}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                allNotifications = data.data || [];
            } else {
                // Use demo notifications if API fails
                allNotifications = getDemoNotifications();
            }
            
            renderNotifications(container);
            
        } catch (error) {
            console.error('Notifications load error:', error);
            // Use demo notifications on error
            allNotifications = getDemoNotifications();
            renderNotifications(container);
        }
    }
    
    function renderNotifications(container) {
        const unreadCount = allNotifications.filter(n => !n.read).length;
        const filteredNotifications = filterNotifications(allNotifications, currentFilter);
        
        container.innerHTML = `
            <div class="max-w-4xl mx-auto space-y-6">
                <!-- Header -->
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-primary">Notifications</h2>
                        <p class="text-sm text-secondary mt-1">${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}</p>
                    </div>
                    <button onclick="NotificationsPage.close()" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <!-- Actions Bar -->
                <div class="modern-card p-4">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <!-- Filters -->
                        <div class="flex flex-wrap gap-2">
                            <button onclick="NotificationsPage.setFilter('all')" class="filter-btn ${currentFilter === 'all' ? 'active' : ''}">
                                All
                            </button>
                            <button onclick="NotificationsPage.setFilter('unread')" class="filter-btn ${currentFilter === 'unread' ? 'active' : ''}">
                                Unread (${unreadCount})
                            </button>
                            <button onclick="NotificationsPage.setFilter('read')" class="filter-btn ${currentFilter === 'read' ? 'active' : ''}">
                                Read
                            </button>
                            <button onclick="NotificationsPage.setFilter('alerts')" class="filter-btn ${currentFilter === 'alerts' ? 'active' : ''}">
                                Alerts
                            </button>
                            <button onclick="NotificationsPage.setFilter('system')" class="filter-btn ${currentFilter === 'system' ? 'active' : ''}">
                                System
                            </button>
                        </div>
                        
                        <!-- Actions -->
                        <div class="flex gap-2">
                            <button onclick="NotificationsPage.markAllRead()" class="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                                Mark all as read
                            </button>
                            <button onclick="NotificationsPage.clearAll()" class="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                Clear all
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Notifications List -->
                ${filteredNotifications.length > 0 ? `
                    <div class="modern-card divide-y divide-gray-200 dark:divide-gray-700">
                        ${filteredNotifications.map(notif => renderNotificationItem(notif)).join('')}
                    </div>
                ` : `
                    <div class="modern-card p-12 text-center">
                        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                        </svg>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Notifications</h3>
                        <p class="text-gray-600 dark:text-gray-400">You're all caught up!</p>
                    </div>
                `}
            </div>
            
            <style>
                .filter-btn {
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #6b7280;
                    background-color: transparent;
                    border-radius: 0.5rem;
                    transition: all 0.2s;
                }
                .filter-btn:hover {
                    background-color: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                }
                .filter-btn.active {
                    background-color: #3b82f6;
                    color: white;
                }
                .dark .filter-btn {
                    color: #9ca3af;
                }
                .dark .filter-btn:hover {
                    background-color: rgba(59, 130, 246, 0.2);
                    color: #60a5fa;
                }
                .dark .filter-btn.active {
                    background-color: #3b82f6;
                    color: white;
                }
            </style>
        `;
    }
    
    function renderNotificationItem(notif) {
        const iconConfig = {
            alert: { icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
            info: { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
            success: { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
            system: { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' }
        };
        
        const config = iconConfig[notif.type] || iconConfig.info;
        const timeAgo = getTimeAgo(notif.created_at);
        
        return `
            <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}">
                <div class="flex gap-4">
                    <!-- Icon -->
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 ${config.bg} rounded-full flex items-center justify-center">
                            <svg class="w-5 h-5 ${config.color}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${config.icon}"/>
                            </svg>
                        </div>
                    </div>
                    
                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex-1">
                                <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 ${!notif.read ? 'font-bold' : ''}">${notif.title}</p>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${notif.message}</p>
                                ${notif.action_url ? `
                                    <button onclick="NotificationsPage.handleAction('${notif.action_url}')" class="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2">
                                        ${notif.action_label || 'View Details'} →
                                    </button>
                                ` : ''}
                            </div>
                            
                            <!-- Time & Actions -->
                            <div class="flex-shrink-0 text-right">
                                <p class="text-xs text-gray-500 dark:text-gray-500">${timeAgo}</p>
                                <div class="flex items-center gap-2 mt-2">
                                    ${!notif.read ? `
                                        <button onclick="NotificationsPage.markAsRead('${notif.id}')" class="text-xs text-blue-600 hover:text-blue-700" title="Mark as read">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                            </svg>
                                        </button>
                                    ` : ''}
                                    <button onclick="NotificationsPage.deleteNotification('${notif.id}')" class="text-xs text-red-600 hover:text-red-700" title="Delete">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    function filterNotifications(notifications, filter) {
        switch(filter) {
            case 'unread':
                return notifications.filter(n => !n.read);
            case 'read':
                return notifications.filter(n => n.read);
            case 'alerts':
                return notifications.filter(n => n.type === 'alert');
            case 'system':
                return notifications.filter(n => n.type === 'system');
            default:
                return notifications;
        }
    }
    
    function setFilter(filter) {
        currentFilter = filter;
        const container = document.getElementById('content-dashboard');
        if (container) {
            renderNotifications(container);
        }
    }
    
    async function markAsRead(notifId) {
        const notif = allNotifications.find(n => n.id === notifId);
        if (notif) {
            notif.read = true;
            
            // Update via API
            try {
                const token = Auth.getToken();
                await fetch(`${API_BASE}/notifications/${notifId}/read`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) {
                console.error('Failed to mark as read:', e);
            }
            
            // Re-render
            const container = document.getElementById('content-dashboard');
            if (container) {
                renderNotifications(container);
            }
        }
    }
    
    async function markAllRead() {
        allNotifications.forEach(n => n.read = true);
        
        // Update via API
        try {
            const token = Auth.getToken();
            await fetch(`${API_BASE}/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {
            console.error('Failed to mark all as read:', e);
        }
        
        // Re-render
        const container = document.getElementById('content-dashboard');
        if (container) {
            renderNotifications(container);
        }
    }
    
    async function deleteNotification(notifId) {
        const index = allNotifications.findIndex(n => n.id === notifId);
        if (index !== -1) {
            allNotifications.splice(index, 1);
            
            // Delete via API
            try {
                const token = Auth.getToken();
                await fetch(`${API_BASE}/notifications/${notifId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) {
                console.error('Failed to delete notification:', e);
            }
            
            // Re-render
            const container = document.getElementById('content-dashboard');
            if (container) {
                renderNotifications(container);
            }
        }
    }
    
    function clearAll() {
        Modal.showDeleteConfirm({
            title: 'Clear All Notifications',
            message: 'Are you sure you want to delete all notifications? This action cannot be undone.',
            onConfirm: async () => {
                allNotifications = [];
                
                // Delete via API
                try {
                    const token = Auth.getToken();
                    await fetch(`${API_BASE}/notifications`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } catch (e) {
                    console.error('Failed to clear notifications:', e);
                }
                
                // Re-render
                const container = document.getElementById('content-dashboard');
                if (container) {
                    renderNotifications(container);
                }
            }
        });
    }
    
    function handleAction(url) {
        // Handle notification action
        console.log('Action URL:', url);
        close();
    }
    
    function close() {
        // Return to dashboard
        switchTab('dashboard');
    }
    
    function getTimeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return then.toLocaleDateString();
    }
    
    function getDemoNotifications() {
        return [
            {
                id: '1',
                type: 'alert',
                title: 'Water Level Warning',
                message: 'Service Road Drain water level above normal threshold - monitoring',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                read: false,
                action_url: '/alerts',
                action_label: 'View Alert'
            },
            {
                id: '2',
                type: 'system',
                title: 'Maintenance Scheduled',
                message: 'Routine maintenance scheduled for Main Perimeter Drain on March 15, 2026',
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                read: false
            },
            {
                id: '3',
                type: 'success',
                title: 'Issue Resolved',
                message: 'Gate House Culvert blockage has been cleared and system is operational',
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                read: true
            },
            {
                id: '4',
                type: 'info',
                title: 'Monthly Report Ready',
                message: 'Your February 2026 system health report is now available',
                created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                read: true,
                action_url: '/reports',
                action_label: 'Download Report'
            },
            {
                id: '5',
                type: 'system',
                title: 'System Update',
                message: 'FlowGuard sensors updated to firmware v2.3.1',
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                read: true
            }
        ];
    }
    
    return {
        render,
        setFilter,
        markAsRead,
        markAllRead,
        deleteNotification,
        clearAll,
        handleAction,
        close
    };
})();
