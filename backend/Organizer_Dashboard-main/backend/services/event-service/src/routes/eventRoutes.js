const express = require("express");
const router = express.Router();

// Test database connection route
router.get('/test', async (req, res) => {
  const { Pool } = require('pg');
  const testPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'organizer_dashboard',
    password: '1323',
    port: 5432,
  });
  
  try {
    const result = await testPool.query('SELECT COUNT(*) FROM events');
    res.json({ message: 'Database connection successful', eventCount: result.rows[0].count });
  } catch (error) {
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  } finally {
    testPool.end();
  }
});

// Import controller functions
const {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
} = require('../controllers/eventController');

// ======================
// Event Routes
// ======================

// Get all events
router.get('/', getEvents);

// Get a single event by ID
router.get('/:id', getEventById);

// Create a new event
router.post('/', createEvent);

// Update an existing event
router.put('/:id', updateEvent);

// Delete an event
router.delete('/:id', deleteEvent);

module.exports = router;
