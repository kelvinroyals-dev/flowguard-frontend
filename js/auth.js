// ============================================
// AUTHENTICATION MODULE
// Handles user authentication and session management
// ============================================

const Auth = (function() {
    
    function getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
    
    function getToken() {
        return localStorage.getItem('token');
    }
    
    function isAuthenticated() {
        const token = getToken();
        const user = getUser();
        
        if (!token || !user) return false;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch(e) {
            return false;
        }
    }
    
    function logout() {
        localStorage.clear();
        window.location.href = 'login.html';
    }
    
    function updateUserInfo() {
        const user = getUser();
        if (!user) return;
        
        const firstName = user.fullName?.split(' ')[0] || 'User';
        const initials = user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
        
        const nameEl = document.getElementById('user-name');
        const avatarEl = document.getElementById('user-avatar');
        const menuNameEl = document.getElementById('menu-user-name');
        const menuEmailEl = document.getElementById('menu-user-email');
        
        if (nameEl) nameEl.textContent = firstName;
        if (avatarEl) avatarEl.textContent = initials;
        if (menuNameEl) menuNameEl.textContent = user.fullName || 'User';
        if (menuEmailEl) menuEmailEl.textContent = user.email || '';
    }
    
    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    }
    
    function getPersonalizedGreeting() {
        const user = getUser();
        const firstName = user?.fullName?.split(' ')[0] || 'there';
        return `${getGreeting()}, ${firstName}!`;
    }
    
    return {
        getUser,
        getToken,
        isAuthenticated,
        logout,
        updateUserInfo,
        getGreeting,
        getPersonalizedGreeting
    };
})();