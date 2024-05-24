const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, taskController.getTasks);
router.get('/:taskId', authenticateToken, taskController.getTask);
router.post('/', authenticateToken, taskController.createTask);
router.put('/:taskId', authenticateToken, taskController.updateTask);
router.delete('/:taskId', authenticateToken, taskController.deleteTask);

module.exports = router;
