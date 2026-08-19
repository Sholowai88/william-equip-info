// config.prod.js
// ============================================================
// PRODUCTION CONFIG - Placeholder for GitHub Actions
// ============================================================
// This file is replaced by GitHub Actions during deployment.
// The real credentials come from GitHub Secrets.
// ============================================================

// This is a placeholder - GitHub Actions will generate the real file
console.log('⚠️ Production config placeholder - waiting for GitHub Actions deployment');

// Try to load from environment or use fallback
const CONFIG = {
    // These will be replaced by GitHub Actions
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    APP_NAME: 'NTWC_MPU_DRWS',
    APP_VERSION: '2.0',
    APP_ENV: 'production',
    ENABLE_DEBUG: false
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.__CONFIG__ = CONFIG;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
