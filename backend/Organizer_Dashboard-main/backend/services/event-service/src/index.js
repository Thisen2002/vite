const express = require('express');
const cors = require('cors');
const path = require('path');

// Load .env from the root directory
require('dotenv').config({ path: path.join(__dirname, '../../../../../.env') });

console.log('🔧 Environment check:');
console.log('DB_PASSWORD set:', !!process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME || 'organizer_dashboard');
console.log('Working directory:', process.cwd());

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_EVENT_SERVICE_PORT || 5002;


// Middleware - fix typo
app.use(cors());
app.use(express.json());

// Routes
const userRoutes = require('./routes/eventRoutes');
app.use('/events', userRoutes);


// Error handling middleware - add this after routes
app.use((req, res, next) => {
    res.status(404).json({
        message: `Route ${req.url} not found`
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!'
    });
});




// Root route
app.get('/', (req, res) => {
    res.send('Event Service is running(Root Route');
});



app.listen(PORT, () => {
    console.log(`Event Service running on port ${PORT}`);
});