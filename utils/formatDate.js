function formatDate(dateString) {
    return new Date(dateString).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

module.exports = formatDate;