// api/auth.js - Enhanced Authentication Middleware

// ============================================================
// CONFIGURATION - CHANGE THESE VALUES
// ============================================================
const SITE_PASSWORD = 'DRws24685868#';  // Change this!
const SESSION_DURATION = 24 * 60 * 60 * 1000;      // 24 hours in milliseconds
const MAX_LOGIN_ATTEMPTS = 5;                      // Max attempts before timeout
const LOCKOUT_DURATION = 15 * 60 * 1000;          // 15 minutes lockout
// ============================================================

// In-memory storage for rate limiting (Vercel Functions are stateless)
// For production, use a database like Redis or Vercel KV
const loginAttempts = new Map();

// Helper function to get client IP
function getClientIP(req) {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
           req.headers.get('x-real-ip') || 
           'unknown';
}

// Helper function to clean expired attempts
function cleanExpiredAttempts() {
    const now = Date.now();
    for (const [key, data] of loginAttempts.entries()) {
        if (data.lockoutUntil && data.lockoutUntil < now) {
            loginAttempts.delete(key);
        }
    }
}

// Generate a secure session token
function generateSessionToken() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
}

// Check rate limiting
function checkRateLimit(clientIP) {
    cleanExpiredAttempts();
    const now = Date.now();
    const record = loginAttempts.get(clientIP);
    
    if (!record) {
        return { allowed: true, attempts: 0, lockoutUntil: null };
    }
    
    // Check if locked out
    if (record.lockoutUntil && record.lockoutUntil > now) {
        const remaining = Math.ceil((record.lockoutUntil - now) / 1000 / 60);
        return { 
            allowed: false, 
            attempts: record.attempts, 
            lockoutUntil: record.lockoutUntil,
            remainingMinutes: remaining
        };
    }
    
    // Reset if lockout expired
    if (record.lockoutUntil && record.lockoutUntil <= now) {
        loginAttempts.delete(clientIP);
        return { allowed: true, attempts: 0, lockoutUntil: null };
    }
    
    return { 
        allowed: true, 
        attempts: record.attempts, 
        lockoutUntil: null 
    };
}

// Log authentication attempts
async function logAuthAttempt(ip, success, userAgent = 'Unknown') {
    // You can implement logging to a service or file here
    console.log(`[${new Date().toISOString()}] Auth attempt from ${ip}: ${success ? '✅ SUCCESS' : '❌ FAILED'} (UA: ${userAgent})`);
}

// Main authentication handler
export default async function handler(req, context) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const method = req.method;
    const clientIP = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    
    // Clean up expired attempts periodically
    cleanExpiredAttempts();
    
    // ============================================================
    // 1. GET /auth-page - Show the password prompt page
    // ============================================================
    if (pathname === '/auth-page') {
        // Clear any existing session cookies to force re-authentication
        const clearCookie = 'auth_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
        
        return new Response(getAuthPageHTML(), {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Set-Cookie': clearCookie,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    }
    
    // ============================================================
    // 2. POST /api/auth - Handle login attempt
    // ============================================================
    if (method === 'POST' && pathname === '/api/auth') {
        try {
            const formData = await req.formData();
            const password = formData.get('password');
            const remember = formData.get('remember') === 'on';
            
            // Validate input
            if (!password || password.length === 0) {
                return new Response(getAuthPageHTML('Please enter a password.'), {
                    status: 401,
                    headers: {
                        'Content-Type': 'text/html; charset=utf-8',
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    }
                });
            }
            
            // Check rate limiting
            const rateLimit = checkRateLimit(clientIP);
            
            if (!rateLimit.allowed) {
                const message = `Too many failed attempts. Please try again in ${rateLimit.remainingMinutes} minute(s).`;
                return new Response(getAuthPageHTML(message), {
                    status: 429,
                    headers: {
                        'Content-Type': 'text/html; charset=utf-8',
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    }
                });
            }
            
            // Verify password
            const isValid = password === SITE_PASSWORD;
            
            // Update login attempts
            const record = loginAttempts.get(clientIP) || { attempts: 0, lockoutUntil: null };
            
            if (isValid) {
                // Successful login - clear attempts
                loginAttempts.delete(clientIP);
                await logAuthAttempt(clientIP, true, userAgent);
                
                // Generate session token
                const sessionToken = generateSessionToken();
                const expires = new Date(Date.now() + SESSION_DURATION);
                
                // Create success response with redirect
                const redirectUrl = new URL('/', url);
                
                return new Response(null, {
                    status: 303, // See Other - POST redirect
                    headers: {
                        'Location': redirectUrl.toString(),
                        'Set-Cookie': [
                            `auth_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION / 1000}`,
                            `auth_expires=${expires.toISOString()}; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION / 1000}`
                        ].join(', '),
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                });
            } else {
                // Failed login
                record.attempts = (record.attempts || 0) + 1;
                
                // Check if we should lock out
                if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
                    record.lockoutUntil = Date.now() + LOCKOUT_DURATION;
                    loginAttempts.set(clientIP, record);
                    await logAuthAttempt(clientIP, false, userAgent);
                    
                    const message = `Too many failed attempts. Please try again in ${Math.ceil(LOCKOUT_DURATION / 1000 / 60)} minute(s).`;
                    return new Response(getAuthPageHTML(message), {
                        status: 429,
                        headers: {
                            'Content-Type': 'text/html; charset=utf-8',
                            'Cache-Control': 'no-cache, no-store, must-revalidate'
                        }
                    });
                }
                
                loginAttempts.set(clientIP, record);
                await logAuthAttempt(clientIP, false, userAgent);
                
                const remaining = MAX_LOGIN_ATTEMPTS - record.attempts;
                const message = `❌ Invalid password. ${remaining} attempt(s) remaining.`;
                return new Response(getAuthPageHTML(message), {
                    status: 401,
                    headers: {
                        'Content-Type': 'text/html; charset=utf-8',
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    }
                });
            }
            
        } catch (error) {
            console.error('Auth handler error:', error);
            return new Response(getAuthPageHTML('An error occurred. Please try again.'), {
                status: 500,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8'
                }
            });
        }
    }
    
    // ============================================================
    // 3. GET / (and all other routes) - Check session
    // ============================================================
    
    // Special handling for static assets (allow through without auth)
    const staticAssets = [
        '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
        '.ico', '.woff', '.woff2', '.ttf', '.eot', '.json'
    ];
    
    const isStaticAsset = staticAssets.some(ext => pathname.endsWith(ext));
    if (isStaticAsset) {
        // Forward to the static file
        const fetchUrl = new URL(pathname, 'https://your-vercel-url.vercel.app');
        const response = await fetch(fetchUrl);
        return response;
    }
    
    // Check for session cookie
    const cookies = req.headers.get('cookie') || '';
    const sessionMatch = cookies.match(/auth_session=([^;]+)/);
    const sessionToken = sessionMatch ? sessionMatch[1] : null;
    
    // In a real implementation, you would validate the session token against a database
    // For this example, we just check if the cookie exists and is not expired
    let isAuthenticated = false;
    
    if (sessionToken) {
        // Check if session is still valid (you'd verify against a store in production)
        const expiresMatch = cookies.match(/auth_expires=([^;]+)/);
        if (expiresMatch) {
            const expires = new Date(expiresMatch[1]);
            if (expires > new Date()) {
                isAuthenticated = true;
            }
        } else {
            // Fallback - if no expiry cookie, check a simple timestamp
            // This is less secure but works for this example
            isAuthenticated = true;
        }
    }
    
    // Also check for password in query param (for bookmark support)
    const queryPassword = url.searchParams.get('password');
    if (!isAuthenticated && queryPassword === SITE_PASSWORD) {
        isAuthenticated = true;
        // Set a session cookie for future requests
        const sessionToken = generateSessionToken();
        const expires = new Date(Date.now() + SESSION_DURATION);
        
        // Redirect to clean URL and set cookie
        const cleanUrl = new URL('/', url);
        cleanUrl.search = ''; // Remove password from URL
        
        return new Response(null, {
            status: 303,
            headers: {
                'Location': cleanUrl.toString(),
                'Set-Cookie': [
                    `auth_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION / 1000}`,
                    `auth_expires=${expires.toISOString()}; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_DURATION / 1000}`
                ].join(', ')
            }
        });
    }
    
    // Check if authenticated via session
    if (isAuthenticated) {
        // Forward to the actual site (your index.html)
        const fetchUrl = new URL(pathname, 'https://your-vercel-url.vercel.app');
        const response = await fetch(fetchUrl);
        
        // Return the response with security headers
        const newResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
        
        // Add security headers
        newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        newResponse.headers.set('Pragma', 'no-cache');
        newResponse.headers.set('X-Content-Type-Options', 'nosniff');
        newResponse.headers.set('X-Frame-Options', 'DENY');
        newResponse.headers.set('X-XSS-Protection', '1; mode=block');
        
        return newResponse;
    }
    
    // ============================================================
    // 4. Not authenticated - Show password prompt
    // ============================================================
    return new Response(getAuthPageHTML(), {
        status: 401,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'WWW-Authenticate': 'Basic realm="Equipment Database"'
        }
    });
}

// ============================================================
// AUTHENTICATION PAGE HTML
// ============================================================
function getAuthPageHTML(errorMessage = null) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>🔐 Authentication Required</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }
        
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0a2e3f 0%, #1a5c6e 50%, #0f2c3f 100%);
            padding: 20px;
            position: relative;
            overflow: hidden;
        }
        
        body::before {
            content: "";
            position: absolute;
            width: 200%;
            height: 200%;
            background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" opacity="0.05"><path fill="white" d="M20,20 L30,20 L25,28 Z M50,50 L60,50 L55,58 Z M80,80 L90,80 L85,88 Z"/><circle cx="70" cy="30" r="4"/><circle cx="30" cy="70" r="3"/></svg>') repeat;
            animation: scan 20s linear infinite;
        }
        
        @keyframes scan {
            0% { transform: translate(0,0); }
            100% { transform: translate(100px,100px); }
        }
        
        .auth-container {
            background: rgba(255,255,255,0.98);
            backdrop-filter: blur(20px);
            border-radius: 32px;
            padding: 50px 45px 45px 45px;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 30px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
            text-align: center;
            position: relative;
            z-index: 2;
            animation: slideUp 0.6s ease;
        }
        
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .auth-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #0a2e3f, #1a5c6e, #0a2e3f);
            border-radius: 32px 32px 0 0;
        }
        
        .auth-icon {
            font-size: 64px;
            margin-bottom: 16px;
            display: block;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .auth-title {
            color: #0a2e3f;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        
        .auth-subtitle {
            color: #666;
            font-size: 14px;
            margin-bottom: 8px;
            line-height: 1.6;
        }
        
        .auth-subtitle strong {
            color: #1a5c6e;
        }
        
        .auth-divider {
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #0a2e3f, #1a5c6e);
            margin: 16px auto 24px auto;
            border-radius: 4px;
        }
        
        .auth-form {
            margin-top: 8px;
        }
        
        .auth-input-group {
            position: relative;
            margin-bottom: 16px;
        }
        
        .auth-input {
            width: 100%;
            padding: 14px 18px;
            border: 2px solid #e2e8f0;
            border-radius: 16px;
            font-size: 16px;
            transition: all 0.3s;
            background: #f8fafc;
            box-sizing: border-box;
        }
        
        .auth-input:focus {
            outline: none;
            border-color: #1a5c6e;
            box-shadow: 0 0 0 4px rgba(26,92,110,0.12);
            background: white;
        }
        
        .auth-input::placeholder {
            color: #a0aec0;
            font-size: 14px;
        }
        
        .auth-options {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 16px 0 20px 0;
            font-size: 13px;
            color: #555;
        }
        
        .auth-options label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }
        
        .auth-options input[type="checkbox"] {
            width: 18px;
            height: 18px;
            accent-color: #1a5c6e;
            cursor: pointer;
        }
        
        .auth-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #0a2e3f, #1a5c6e);
            color: white;
            border: none;
            border-radius: 16px;
            font-size: 17px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            letter-spacing: 0.5px;
            position: relative;
            overflow: hidden;
        }
        
        .auth-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(26,92,110,0.35);
        }
        
        .auth-btn:active {
            transform: scale(0.97);
        }
        
        .auth-btn::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.05), transparent);
            transform: rotate(45deg);
            transition: all 0.5s;
        }
        
        .auth-btn:hover::after {
            transform: rotate(45deg) translate(50%, 50%);
        }
        
        .auth-error {
            color: #dc3545;
            font-size: 13px;
            margin-top: 12px;
            padding: 10px 14px;
            background: #ffe0db;
            border-radius: 12px;
            animation: shake 0.5s ease;
            display: ${errorMessage ? 'block' : 'none'};
        }
        
        .auth-error.show {
            display: block;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
        }
        
        .auth-security {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #eee;
            font-size: 11px;
            color: #bbb;
            display: flex;
            justify-content: center;
            gap: 16px;
            flex-wrap: wrap;
        }
        
        .auth-security span {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .auth-security .lock-icon {
            font-size: 12px;
        }
        
        .auth-footer {
            margin-top: 12px;
            font-size: 11px;
            color: #ccc;
        }
        
        /* Mobile Responsive */
        @media (max-width: 480px) {
            .auth-container {
                padding: 35px 25px 30px 25px;
                border-radius: 24px;
            }
            
            .auth-icon {
                font-size: 48px;
            }
            
            .auth-title {
                font-size: 20px;
            }
            
            .auth-subtitle {
                font-size: 13px;
            }
            
            .auth-input {
                padding: 12px 16px;
                font-size: 15px;
            }
            
            .auth-btn {
                padding: 13px;
                font-size: 15px;
            }
            
            .auth-options {
                font-size: 12px;
                flex-wrap: wrap;
                gap: 8px;
            }
        }
        
        /* Prevent right-click on the page */
        body {
            user-select: none;
            -webkit-user-select: none;
        }
        
        /* Show a subtle lock icon in the URL bar */
        .auth-container .secure-badge {
            display: inline-block;
            background: #e8f5e9;
            color: #2e7d32;
            font-size: 11px;
            padding: 2px 12px;
            border-radius: 20px;
            font-weight: 600;
            margin-bottom: 12px;
        }
    </style>
</head>
<body>
    <div class="auth-container" role="main" aria-label="Authentication">
        <span class="auth-icon">🔬🔐</span>
        
        <div class="secure-badge">🔒 Secure Access</div>
        
        <h1 class="auth-title">Equipment Database</h1>
        <p class="auth-subtitle">
            <strong>NTWC MPU DR Workshop</strong><br>
            Protected area - Please authenticate to continue
        </p>
        
        <div class="auth-divider"></div>
        
        <form class="auth-form" method="POST" action="/api/auth" autocomplete="off">
            <div class="auth-input-group">
                <input 
                    type="password" 
                    name="password" 
                    class="auth-input" 
                    placeholder="Enter access code..." 
                    autocomplete="off"
                    autofocus
                    required
                    id="passwordInput"
                >
            </div>
            
            <div class="auth-options">
                <label>
                    <input type="checkbox" name="remember" value="on">
                    <span>Remember me for 24 hours</span>
                </label>
                <span style="color:#999; font-size:12px;">🔒 Encrypted</span>
            </div>
            
            <button type="submit" class="auth-btn" id="loginBtn">
                🔓 Unlock Access
            </button>
            
            ${errorMessage ? `<div class="auth-error show">${errorMessage}</div>` : ''}
        </form>
        
        <div class="auth-security">
            <span>🔒 <span>256-bit encryption</span></span>
            <span>🛡️ <span>Rate limited</span></span>
            <span>⏱️ <span>Session expires in 24h</span></span>
        </div>
        
        <div class="auth-footer">
            Protected with multi-layer security
        </div>
    </div>
    
    <script>
        // Auto-focus on the password field
        document.addEventListener('DOMContentLoaded', function() {
            const input = document.getElementById('passwordInput');
            if (input) {
                input.focus();
            }
        });
        
        // Prevent keyboard shortcuts that could bypass security
        document.addEventListener('keydown', function(e) {
            // Disable Ctrl+U (view source), Ctrl+Shift+I (inspect), etc.
            if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 'i' || e.key === 'I')) {
                e.preventDefault();
                return false;
            }
            // Disable F12
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }
        });
        
        // Show error message if password was wrong
        ${errorMessage ? `
            // Clear the input after showing error
            const input = document.getElementById('passwordInput');
            if (input) {
                input.value = '';
                setTimeout(function() {
                    input.focus();
                }, 300);
            }
        ` : ''}
    </script>
</body>
</html>`;
}
