const mongoose = require('mongoose')
// Schema
const Contact = mongoose.model('Contact', {
    name: {
        type: String,
        required: true
    },
    number: {
        type: String,
        required: true
    },
    email: {
        type: String
    }
})
module.exports = Contact