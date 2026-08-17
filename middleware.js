// middleware.js
export function middleware(request) {
  // ============================================================
  // CHANGE THESE - Set your username and password
  // ============================================================
  const USERNAME = process.env.AUTH_USERNAME || "drws";
  const PASSWORD = process.env.AUTH_PASSWORD || "DRws24685868#";
  // ============================================================
  
  const auth = request.headers.get('authorization');
  
  if (!auth) {
    return new Response('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' }
    });
  }
  
  try {
    const [username, password] = atob(auth.split(' ')[1]).split(':');
    
    if (username !== USERNAME || password !== PASSWORD) {
      return new Response('Invalid credentials', { 
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' }
      });
    }
  } catch (error) {
    return new Response('Invalid credentials', { 
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' }
    });
  }
}

export const config = {
  matcher: '/:path*',
};
