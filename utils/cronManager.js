// utils/cronManager.js
const cron = require('node-cron');
const sendDeadlineReminder = require('./emailSender');

const jobs = {};

const scheduleJob = (jobId, date, emailDetails) => {
    if (typeof jobId !== 'string') {
        console.log('jobId must be a string');
        return;
    }

    if (jobs[jobId]) {
        jobs[jobId].stop();
    }

    if (isNaN(Date.parse(date))) {
        console.log('Invalid date');
        return;
    }

    const cronTime = new Date(date);
    const cronString = `${cronTime.getSeconds()} ${cronTime.getMinutes()} ${cronTime.getHours()} ${cronTime.getDate()} ${cronTime.getMonth() + 1} *`;

    jobs[jobId] = cron.schedule(cronString, () => {
        sendDeadlineReminder(emailDetails.to, emailDetails.subject, emailDetails.text);
    });
};

const cancelJob = (jobId) => {
    if (typeof jobId !== 'string') {
        console.log('jobId must be a string');
        return;
    }

    if (jobs[jobId]) {
        jobs[jobId].stop();
        delete jobs[jobId];
    }
};

module.exports = {
    scheduleJob,
    cancelJob,
};
