const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the User schema
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    }
    // You can add more fields as needed
}, { timestamps: true });

// Create a model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
