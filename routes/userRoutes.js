const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

router.get('/users', authenticateToken, userController.getUser);
router.patch('/users', authenticateToken, userController.updateUser);
router.delete('/users', authenticateToken, userController.deleteUser);

router.get('/test', userController.testUser);



module.exports = router;