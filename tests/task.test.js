const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const Task = require('../models/Task');
const User = require('../models/User');
const taskRoutes = require('../routes/taskRoutes');
const { cancelJob } = require('../utils/cronManager');
const app = express();

app.use(express.json());
app.use('/api/v1/tasks', taskRoutes);

dotenv.config();

describe('Task Routes', () => {
    let server;
    let token;
    let userId;
    let scheduledJobs = [];

    beforeAll(async () => {
        // Connect to a test database
        await mongoose.connect(process.env.MONGODB_TEST_URI);

        // Start the server
        server = app.listen(3002);

        // Create a test user
        const hashedPassword = await bcrypt.hash('testpassword', 10);
        const user = new User({ username: 'taskuser', email: 'taskuser@example.com', password: hashedPassword });
        await user.save();
        userId = user._id;
        token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    });

    afterAll(async () => {
        // Clean up test database
        await mongoose.connection.dropDatabase();

        // Cancel scheduled jobs
        scheduledJobs.forEach(jobId => cancelJob(jobId));

        // Close the server
        await server.close();

        // Disconnect from the test database
        await mongoose.connection.close();
    });

    it('should create a new task', async () => {
        const res = await request(app)
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Test Task',
                description: 'This is a test task',
                dueDate: new Date()
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('title', 'Test Task');
        expect(res.body).toHaveProperty('description', 'This is a test task');

        // Track the scheduled job IDs
        const taskId = res.body._id;
        scheduledJobs.push(`${taskId}-day`);
        scheduledJobs.push(`${taskId}-hour`);
    });

    it('should get all tasks for a user', async () => {
        const res = await request(app)
            .get('/api/v1/tasks')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get a specific task by ID', async () => {
        const task = new Task({
            title: 'Specific Task',
            description: 'This is a specific task',
            dueDate: new Date(),
            ownerId: userId
        });
        await task.save();

        const res = await request(app)
            .get(`/api/v1/tasks/${task._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('title', 'Specific Task');
        expect(res.body).toHaveProperty('description', 'This is a specific task');
    });

    it('should update a task', async () => {
        const task = new Task({
            title: 'Task to Update',
            description: 'This task will be updated',
            dueDate: new Date(),
            ownerId: userId
        });
        await task.save();

        const res = await request(app)
            .put(`/api/v1/tasks/${task._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Updated Task',
                description: 'This task has been updated'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('title', 'Updated Task');
        expect(res.body).toHaveProperty('description', 'This task has been updated');

        // Track the scheduled job IDs
        const taskId = task._id.toString();
        scheduledJobs.push(`${taskId}-day`);
        scheduledJobs.push(`${taskId}-hour`);
    });

    it('should delete a task', async () => {
        const task = new Task({
            title: 'Task to Delete',
            description: 'This task will be deleted',
            dueDate: new Date(),
            ownerId: userId
        });
        await task.save();

        const res = await request(app)
            .delete(`/api/v1/tasks/${task._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Task deleted successfully');
    });
});
