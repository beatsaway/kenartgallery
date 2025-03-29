const express = require('express');
const path = require('path');
const app = express();
const port = 8000;

// Environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('Starting server with configuration:', {
    PORT,
    NODE_ENV,
    __dirname
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
const publicPath = path.join(__dirname, 'public');
console.log('Serving static files from:', publicPath);
app.use(express.static(publicPath));

// Serve node_modules (only in development)
if (NODE_ENV === 'development') {
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    console.log('Serving node_modules from:', nodeModulesPath);
    app.use('/node_modules', express.static(nodeModulesPath));
}

// Health check endpoint for Render
app.get('/healthz', (req, res) => {
    console.log('Health check requested');
    res.status(200).json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        port: PORT
    });
});

// Root endpoint
app.get('/', (req, res) => {
    console.log('Root endpoint requested');
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Handle 404s
app.use((req, res) => {
    console.log('404 for path:', req.path);
    res.status(404).send('Not found');
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} in ${NODE_ENV} mode`);
    console.log(`Health check available at http://localhost:${PORT}/healthz`);
}); 