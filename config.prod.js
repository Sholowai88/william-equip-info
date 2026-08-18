// ============================================================
// PRODUCTION CONFIG - Manual Creation
// ============================================================

const CONFIG = {
    SUPABASE_URL: 'https://qhuqlhzvpmhykkmmqtth.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodXFsaHp2cG1oeWtrbW1xdHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMTM0OTQsImV4cCI6MjA5Njc4OTQ5NH0.pTTY4irj4vx-us8W1DyYaEB6ug_wEjuwNdy0lJjh_-8',
    APP_NAME: 'NTWC_MPU_DRWS',
    APP_VERSION: '2.0',
    APP_ENV: 'production',
    ENABLE_DEBUG: false
};

if (typeof window !== 'undefined') {
    window.__CONFIG__ = CONFIG;
}

console.log('✅ Production config loaded successfully');
console.log('📊 Environment:', CONFIG.APP_ENV);
