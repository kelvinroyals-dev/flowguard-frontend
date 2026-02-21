// ============================================
// STATE MANAGER
// Manages user onboarding state based on existing backend schema
// Uses: properties.status field to determine state
// ============================================

const StateManager = (function() {
    let currentState = null;
    let userProperties = [];
    let currentProperty = null;
    let userPreferences = null;
    
    // State constants based on properties.status
    const STATES = {
        NO_PROPERTY: 'NO_PROPERTY',                    // No properties submitted
        SUBMITTED: 'submitted',                         // Property submitted, awaiting inspection
        INSPECTION_SCHEDULED: 'inspection_scheduled',   // Inspection scheduled
        INSPECTION_ONGOING: 'inspection_ongoing',       // Inspection in progress
        REPORT_READY: 'report_ready',                   // Inspection complete, report ready
        QUOTE_SENT: 'quote_sent',                       // Quote sent to client
        PAYMENT_PENDING: 'payment_pending',             // Awaiting payment
        PAYMENT_COMPLETED: 'payment_completed',         // Payment received, awaiting deployment
        DEPLOYMENT_SCHEDULED: 'deployment_scheduled',   // Deployment scheduled
        ACTIVE: 'active',                               // System deployed and active
        SUSPENDED: 'suspended',                         // Subscription suspended
        CANCELLED: 'cancelled'                          // Contract cancelled
    };
    
    function determineState(properties, preferences) {
        userProperties = properties || [];
        userPreferences = preferences;
        
        if (!properties || properties.length === 0) {
            currentState = STATES.NO_PROPERTY;
            currentProperty = null;
            return currentState;
        }
        
        // Use first property (or selected property)
        currentProperty = properties[0];
        currentState = currentProperty.status;
        
        return currentState;
    }
    
    function init(properties, preferences) {
        return determineState(properties, preferences);
    }
    
    function getCurrentState() {
        return currentState;
    }
    
    function getCurrentProperty() {
        return currentProperty;
    }
    
    function getAllProperties() {
        return userProperties;
    }
    
    function setCurrentProperty(property) {
        currentProperty = property;
        currentState = property.status;
    }
    
    function getUserPreferences() {
        return userPreferences;
    }
    
    // Determine which tabs to show based on state
    function shouldShowTab(tabName) {
        // Only show full dashboard tabs when status is 'active'
        if (currentState === STATES.ACTIVE) {
            return true;
        }
        
        // Hide these tabs until deployed
        const restrictedTabs = ['assets', 'billing', 'support'];
        return !restrictedTabs.includes(tabName);
    }
    
    // Get progress checklist for UI
    function getProgressChecklist() {
        const steps = [
            { 
                id: 'account', 
                label: 'Account Created', 
                completed: true,
                icon: 'user'
            },
            { 
                id: 'property', 
                label: 'Property Submitted', 
                completed: currentState !== STATES.NO_PROPERTY,
                icon: 'home'
            },
            { 
                id: 'inspection', 
                label: 'Inspection Completed', 
                completed: ['report_ready', 'quote_sent', 'payment_pending', 'payment_completed', 'deployment_scheduled', 'active'].includes(currentState),
                icon: 'clipboard'
            },
            { 
                id: 'quote', 
                label: 'Quote Review', 
                completed: ['quote_sent', 'payment_pending', 'payment_completed', 'deployment_scheduled', 'active'].includes(currentState),
                icon: 'document'
            },
            { 
                id: 'payment', 
                label: 'Payment', 
                completed: ['payment_completed', 'deployment_scheduled', 'active'].includes(currentState),
                icon: 'credit-card'
            },
            { 
                id: 'deployment', 
                label: 'System Deployed', 
                completed: currentState === STATES.ACTIVE,
                icon: 'check-circle'
            }
        ];
        
        return steps;
    }
    
    // Check if demo toggle should be visible
    function shouldShowDemoToggle() {
        return currentState === STATES.NO_PROPERTY;
    }
    
    return {
        STATES,
        init,
        getCurrentState,
        getCurrentProperty,
        getAllProperties,
        setCurrentProperty,
        getUserPreferences,
        shouldShowTab,
        getProgressChecklist,
        shouldShowDemoToggle
    };
})();
