const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db'); // Import DB connection

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser
app.use(express.json());

// Mount routers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // Import user routes

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // Mount user routes

const postRoutes = require('./routes/postRoutes'); // Import post routes
app.use('/api/posts', postRoutes); // Mount post routes

const adminRoutes = require('./routes/adminRoutes'); // Import admin routes
app.use('/api/admin', adminRoutes); // Mount admin routes

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Handler Middleware (should be last piece of middleware)
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler); // Add this after creating the error handler

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
