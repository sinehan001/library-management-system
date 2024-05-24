const express = require('express');
const connectDB = require('./config/db.config');
const app = express();
require('dotenv').config();

const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');

const syncHandler = require('./middleware/syncHandler');
const errorHandler = require('./middleware/errorHandler');

// Connect Database
connectDB();

// Init Middleware
app.use(express.json());

// Define Routes
app.use('/auth/v1', syncHandler(userRoutes));
app.use('/api/v1/tasks', syncHandler(taskRoutes));

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// 
let server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

process.on('unhandledRejection', err => {
    console.log('UnExpected Error Occurred! Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
