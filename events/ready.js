module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}!`);
        client.user.setActivity('Zentry Store', { type: 'WATCHING' });
    }
}; 