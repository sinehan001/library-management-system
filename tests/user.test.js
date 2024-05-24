const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const User = require('../models/User');
const userRoutes = require('../routes/userRoutes');
const app = express();

app.use(express.json());
app.use('/auth/v1', userRoutes);

dotenv.config();

describe('User Routes', () => {
    let server;
    let token;
    let userId;

    beforeAll(async () => {
        // Connect to a test database
        await mongoose.connect(process.env.MONGODB_TEST_URI);

        // Start the server
        server = app.listen(3001);

        // Create a test user
        const hashedPassword = await bcrypt.hash('testpassword', 10);
        const user = new User({ username: 'testuser', email: 'testuser@example.com', password: hashedPassword });
        await user.save();
        userId = user._id;
        token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    });

    afterAll(async () => {
        // Clean up test database
        await mongoose.connection.dropDatabase();

        // Close the server
        await server.close();

        // Disconnect from the test database
        await mongoose.connection.close();
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/auth/v1/register')
            .send({
                username: 'newuser',
                email: 'newuser@example.com',
                password: 'newpassword'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'User registered successfully');

        const newUser = await User.findOne({ email: 'newuser@example.com' });
        expect(newUser).not.toBeNull();
        const isPasswordMatch = await bcrypt.compare('newpassword', newUser.password);
        expect(isPasswordMatch).toBe(true);
    });

    it('should not register an existing user', async () => {
        const res = await request(app)
            .post('/auth/v1/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'testpassword'
            });
        expect(res.statusCode).toEqual(409);
        expect(res.body).toHaveProperty('message', 'User already exists');
    });

    it('should login a user', async () => {
        const res = await request(app)
            .post('/auth/v1/login')
            .send({
                username: 'testuser',
                password: 'testpassword'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('accessToken');
    });

    it('should get a user profile', async () => {
        const res = await request(app)
            .get('/auth/v1/users')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('username', 'testuser');
        expect(res.body).toHaveProperty('email', 'testuser@example.com');
    });

    it('should update a user profile', async () => {
        const res = await request(app)
            .patch('/auth/v1/users')
            .set('Authorization', `Bearer ${token}`)
            .send({
                fullName: 'Test User'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('fullName', 'Test User');
    });

    it('should delete a user account', async () => {
        const res = await request(app)
            .delete('/auth/v1/users')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'User deleted successfully');
    });

    it('should test user route', async () => {
        const res = await request(app)
            .get('/auth/v1/test');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'User is authenticated');
    });
});
