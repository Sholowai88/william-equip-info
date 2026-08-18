// ============================================================
// CONFIGURATION TEMPLATE
// ============================================================
// IMPORTANT: DO NOT PUT REAL CREDENTIALS HERE!
// Copy this file to config.js and add your real credentials.
// config.js is gitignored and will NOT be uploaded to GitHub.
// ============================================================

const CONFIG = {
    // Supabase Configuration - Replace with your actual values
    SUPABASE_URL: 'YOUR_SUPABASE_URL_HERE',
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY_HERE',
    
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
