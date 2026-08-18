// ============================================================
// CONFIGURATION TEMPLATE
// ============================================================
// IMPORTANT: DO NOT PUT REAL CREDENTIALS HERE!
// Copy this file to config.js and add your real credentials.
// config.js is gitignored and will NOT be uploaded to GitHub.
// ============================================================

const CONFIG = {
    // Supabase Configuration - Replace with your actual values
    SUPABASE_URL: 'https://qhuqlhzvpmhykkmmqtth.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodXFsaHp2cG1oeWtrbW1xdHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMTM0OTQsImV4cCI6MjA5Njc4OTQ5NH0.pTTY4irj4vx-us8W1DyYaEB6ug_wEjuwNdy0lJjh_-8',
    
    // App Configuration
    APP_NAME: 'NTWC_MPU_DRWS',
    APP_VERSION: '2.0',
    APP_ENV: 'development',
    
    // Features
    ENABLE_DEBUG: true,
    ENABLE_LOGGING: true
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.__CONFIG__ = CONFIG;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// If you're using this template, replace the placeholder values above
console.log('📝 Using config template - please replace with real values!');
