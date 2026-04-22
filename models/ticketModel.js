const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    category: { type: String, required: true },
    channelId: { type: String, required: true },
    guildId: { type: String, required: true },
    status: { type: String, default: 'open', enum: ['open', 'closed'] },
    createdAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    transcript: { type: String },
});

module.exports = mongoose.model('Ticket', ticketSchema);