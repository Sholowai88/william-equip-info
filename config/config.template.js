// ============================================================
// CONFIGURATION TEMPLATE - NO REAL CREDENTIALS HERE!
// ============================================================
// IMPORTANT: 
// 1. Copy this file to config.js
// 2. Add your real Supabase credentials
// 3. config.js is gitignored - it will NOT be uploaded to GitHub
// ============================================================

const CONFIG = {
    // Supabase Configuration - REPLACE WITH YOUR REAL VALUES
    SUPABASE_URL: 'YOUR_SUPABASE_URL_HERE',
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY_HERE',
    
    // App Configuration
    APP_NAME: 'NTWC_MPU_DRWS',
    APP_VERSION: '2.0',
    APP_ENV: 'development',
    ENABLE_DEBUG: true
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.__CONFIG__ = CONFIG;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

console.log('📝 Using config template - please replace with real values!');
console.log('⚠️ Copy this file to config.js and add your real credentials.');
