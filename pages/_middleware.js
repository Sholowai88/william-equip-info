// pages/_middleware.js
export function middleware(request) {
  const USERNAME = "drws";
  const PASSWORD = "DRws24685868#";
  
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"'
      }
    });
  }
  
  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(':');
    
    if (username === USERNAME && password === PASSWORD) {
      return;
    }
  } catch (error) {}
  
  return new Response('Invalid credentials', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"'
    }
  });
}
