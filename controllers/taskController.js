const Task = require('../models/Task');
const mongoose = require('mongoose');
const formatDate = require('../utils/formatDate');
const { scheduleJob, cancelJob } = require('../utils/cronManager');

exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ ownerId: req.user._id });

        const formattedTasks = tasks.map(task => {
            return {
                ...task._doc,
                dueDate: formatDate(task.dueDate),
                createdAt: formatDate(task.createdAt),
                updatedAt: formatDate(task.updatedAt)
            }
        })
        res.json(formattedTasks);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.getTask = async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.taskId, ownerId: req.user._id });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json(task);
    } catch (err) {
        res.status(500).send('Server Error');
    }
}

exports.createTask = async (req, res) => {
    try {
        const task = new Task({ ...req.body, ownerId: req.user._id });
        task.dueDate = new Date(req.body.dueDate);
        await task.save();

        const formattedTask = {
            ...task._doc,
            dueDate: formatDate(task.dueDate),
            createdAt: formatDate(task.createdAt),
            updatedAt: formatDate(task.updatedAt)
        }

        const user = req.user;
        const subject = `Reminder: Task "${task.title}" Deadline`;
        const text = `Dear ${user.fullName??user.username},\n\nThis is a reminder that your task "${task.title}" is due on ${task.dueDate}.\n\nBest regards,\nTask Manager Team`;

        const currentTime = new Date();
        let dueDate = new Date(task.dueDate);
        const timeDiff = dueDate - currentTime;

        const oneDayInMs = 24 * 60 * 60 * 1000;
        const oneHourInMs = 60 * 60 * 1000;

        const taskId = task._id.toString();

        if (timeDiff > oneDayInMs) {
            const dayBefore = new Date(dueDate);
            dayBefore.setDate(dayBefore.getDate() - 1);
            scheduleJob(`${taskId}-day`, dayBefore, { to: user.email, subject, text });
        }

        if (timeDiff > oneHourInMs) {
            const hourBefore = new Date(dueDate);
            hourBefore.setHours(hourBefore.getHours() - 1);
            scheduleJob(`${taskId}-hour`, hourBefore, { to: user.email, subject, text });
        } else {
            // If less than an hour, schedule immediately
            scheduleJob(`${taskId}-hour`, dueDate, { to: user.email, subject, text });
        }

        res.status(201).json(formattedTask);
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error '+err.message);
    }
};

exports.updateTask = async (req, res) => {
    const { taskId } = req.params;
    const ownerId = req.user._id;
    const updates = req.body;

    try {
        // Check if taskId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ msg: 'Invalid task ID' });
        }
        // Find the task by _id and ownerId
        const task = await Task.findOneAndUpdate(
            { _id: taskId, ownerId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        const formattedTask = {
            ...task._doc,
            dueDate: formatDate(task.dueDate),
            createdAt: formatDate(task.createdAt),
            updatedAt: formatDate(task.updatedAt)
        }

        const user = req.user;
        const subject = `Reminder: Task "${task.title}" Deadline`;
        const text = `Dear ${user.fullName??user.username},\n\nThis is a reminder that your task "${task.title}" is due on ${task.dueDate}.\n\nBest regards,\nTask Manager Team`;

        // Cancel old jobs
        cancelJob(`${taskId}-day`);
        cancelJob(`${taskId}-hour`);

        const currentTime = new Date();
        const dueDate = new Date(task.dueDate);
        const timeDiff = dueDate - currentTime;

        const oneDayInMs = 24 * 60 * 60 * 1000;
        const oneHourInMs = 60 * 60 * 1000;

        if (timeDiff > oneDayInMs) {
            const dayBefore = new Date(dueDate);
            dayBefore.setDate(dayBefore.getDate() - 1);
            scheduleJob(`${taskId}-day`, dayBefore, { to: user.email, subject, text });
        }

        if (timeDiff > oneHourInMs) {
            const hourBefore = new Date(dueDate);
            hourBefore.setHours(hourBefore.getHours() - 1);
            scheduleJob(`${taskId}-hour`, hourBefore, { to: user.email, subject, text });
        } else {
            // If less than an hour, schedule immediately
            scheduleJob(`${taskId}-hour`, dueDate, { to: user.email, subject, text });
        }
        
        res.json(formattedTask);
    } catch (err) {
        res.status(500).send('Server Error ' + err.message);
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.taskId, ownerId: req.user._id });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        const taskId = task._id.toString();
        cancelJob(`${taskId}-day`);
        cancelJob(`${taskId}-hour`);
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};
