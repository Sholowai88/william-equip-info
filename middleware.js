// middleware.js - Place this in your repository root
export function middleware(request) {
  // ============================================================
  // CHANGE THESE - Set your username and password
  // ============================================================
  const USERNAME = "drws";
  const PASSWORD = "DRws24685868#";
  // ============================================================
  
  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  
  // If no auth header, ask for credentials
  if (!authHeader) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
        'Content-Type': 'text/html'
      }
    });
  }
  
  try {
    // Decode the base64 credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(':');
    
    // Check credentials
    if (username === USERNAME && password === PASSWORD) {
      // Credentials correct - allow access
      return;
    }
  } catch (error) {
    // Invalid credentials
  }
  
  // Invalid credentials - ask again
  return new Response('Invalid credentials', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"'
    }
  });
}

// Configure which paths to protect
export const config = {
  matcher: '/:path*',
};
