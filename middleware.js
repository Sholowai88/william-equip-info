export function middleware(request) {
  const auth = request.headers.get('authorization');
  
  if (!auth) {
    return new Response('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' }
    });
  }
  
  const [username, password] = atob(auth.split(' ')[1]).split(':');
  
  if (password !== 'DRws24685868#') {
    return new Response('Invalid credentials', { status: 401 });
  }
}
