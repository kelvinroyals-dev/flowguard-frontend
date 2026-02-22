// ============================================
// MODAL COMPONENT
// Reusable modal for confirmations and dialogs
// ============================================

const Modal = (function() {
    
    function showConfirm(options) {
        const {
            title = 'Confirm Action',
            message = 'Are you sure?',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            confirmClass = 'bg-blue-600 hover:bg-blue-700',
            onConfirm = () => {},
            onCancel = () => {}
        } = options;
        
        // Remove existing modal if any
        removeModal();
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'confirmation-modal';
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="modern-card max-w-md w-full p-6 animate-scale-up">
                <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">${title}</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6">${message}</p>
                <div class="flex gap-3 justify-end">
                    <button id="modal-cancel" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors">
                        ${cancelText}
                    </button>
                    <button id="modal-confirm" class="px-4 py-2 ${confirmClass} text-white rounded-lg font-medium transition-colors">
                        ${confirmText}
                    </button>
                </div>
            </div>
            
            <style>
                @keyframes scale-up {
                    from {
                        transform: scale(0.95);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-scale-up {
                    animation: scale-up 0.2s ease-out;
                }
            </style>
        `;
        
        document.body.appendChild(modal);
        
        // Event handlers
        document.getElementById('modal-confirm').addEventListener('click', () => {
            onConfirm();
            removeModal();
        });
        
        document.getElementById('modal-cancel').addEventListener('click', () => {
            onCancel();
            removeModal();
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                onCancel();
                removeModal();
            }
        });
        
        // Close on escape
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                onCancel();
                removeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
    
    function showLogoutConfirm() {
        showConfirm({
            title: 'Sign Out',
            message: 'Are you sure you want to sign out of your account?',
            confirmText: 'Sign Out',
            cancelText: 'Stay',
            confirmClass: 'bg-red-600 hover:bg-red-700',
            onConfirm: () => {
                Auth.logout();
            }
        });
    }
    
    function showDeleteConfirm(options) {
        const {
            title = 'Delete Item',
            message = 'This action cannot be undone.',
            onConfirm = () => {}
        } = options;
        
        showConfirm({
            title,
            message,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmClass: 'bg-red-600 hover:bg-red-700',
            onConfirm
        });
    }
    
    function showAlert(options) {
        const {
            title = 'Alert',
            message = '',
            type = 'info', // info, success, warning, error
            buttonText = 'OK'
        } = options;
        
        // Remove existing modal if any
        removeModal();
        
        const colors = {
            info: { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600' },
            success: { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600' },
            warning: { icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600' },
            error: { icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600' }
        };
        
        const config = colors[type] || colors.info;
        
        const modal = document.createElement('div');
        modal.id = 'confirmation-modal';
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="modern-card max-w-md w-full p-6 animate-scale-up">
                <div class="flex items-start gap-4 mb-6">
                    <div class="w-12 h-12 ${config.bg} rounded-full flex items-center justify-center flex-shrink-0">
                        <svg class="w-6 h-6 ${config.text}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${config.icon}"/>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">${title}</h3>
                        <p class="text-gray-600 dark:text-gray-400">${message}</p>
                    </div>
                </div>
                <div class="flex justify-end">
                    <button id="modal-ok" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                        ${buttonText}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('modal-ok').addEventListener('click', removeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) removeModal();
        });
    }
    
    function removeModal() {
        const modal = document.getElementById('confirmation-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    return {
        showConfirm,
        showLogoutConfirm,
        showDeleteConfirm,
        showAlert,
        removeModal
    };
})();
