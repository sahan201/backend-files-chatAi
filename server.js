import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Import route files
import authRoutes from './routes/auth.js';
import vehicleRoutes from './routes/vehicles.js';
import appointmentRoutes from './routes/appointments.js';
import inventoryRoutes from './routes/inventory.js';        // NEW
import managerRoutes from './routes/manager.js';            // NEW
import mechanicRoutes from './routes/mechanic.js';          // NEW
import feedbackRoutes from './routes/feedback.js';          // NEW
import settingsRoutes from './routes/settings.js';          // NEW

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for PDF receipts)
app.use(express.static('public'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/inventory', inventoryRoutes);        // NEW
app.use('/api/manager', managerRoutes);            // NEW
app.use('/api/mechanic', mechanicRoutes);          // NEW
app.use('/api/feedback', feedbackRoutes);          // NEW
app.use('/api/settings', settingsRoutes);          // NEW

// Basic route for testing
app.get('/', (req, res) => {
  res.json({
    message: 'Vehicle Service Center API',
    version: '2.0.0',
    status: 'Running',
    endpoints: {
      auth: '/api/auth (register, login, me)',
      vehicles: '/api/vehicles',
      appointments: '/api/appointments',
      inventory: '/api/inventory',        // NEW
      manager: '/api/manager',            // NEW
      mechanic: '/api/mechanic',          // NEW
      feedback: '/api/feedback',          // NEW
      settings: '/api/settings',          // NEW
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log('='.repeat(50));
});