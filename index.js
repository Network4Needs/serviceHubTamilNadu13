// Enhanced API handler for Vercel deployment

// Export handler for serverless function
export default function handler(req, res) {
  // Enable CORS for all requests
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS method for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Log request info for debugging
  console.log('Request path:', req.url);
  console.log('Request method:', req.method);
  console.log('Environment:', process.env.NODE_ENV);
  
  // Handle different paths
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  // Health check endpoint
  if (path === '/api/health' || path === '/health') {
    res.status(200).json({ 
      status: 'ok', 
      message: 'Nalamini Service Platform API is running',
      time: new Date().toISOString(),
      env: process.env.NODE_ENV || 'unknown'
    });
    return;
  }
  
  // Database migration endpoint
  if (path === '/api/run-migrations' || path === '/run-migrations') {
    // This will be handled by the specific run-migrations.js file
    res.status(200).json({ 
      status: 'forward',
      message: 'Request forwarded to migration handler'
    });
    return;
  }
  
  // Handle other API routes
  if (path.startsWith('/api/')) {
    res.status(200).json({ 
      status: 'ok', 
      message: 'Nalamini API handler', 
      path: path,
      env: process.env.NODE_ENV || 'unknown',
      time: new Date().toISOString()
    });
    return;
  }
  
  // Default response - serve application info
  res.status(200).json({
    application: 'Nalamini Service Platform',
    status: 'online',
    version: '1.0',
    environment: process.env.NODE_ENV || 'unknown',
    time: new Date().toISOString(),
    documentation: 'Please visit /api/health for API status'
  });
}