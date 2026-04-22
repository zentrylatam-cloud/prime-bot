module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // Ignorar bots y mensajes sin prefijo
        if (message.author.bot) return;

        const prefix = process.env.PREFIX || '!';
        if (!message.content.startsWith(prefix)) return;

        // Extraer comando y argumentos
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();

        if (!commandName) return;

        // Buscar comando
        const command = client.prefixCommands?.get(commandName);
        if (!command) {
            console.warn(`⚠️  Comando de prefijo no encontrado: ${commandName}`);
            return;
        }

        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error('❌ Error al ejecutar comando de prefijo:', error);
            await message.reply({
                content: 'Hubo un error al ejecutar el comando.',
                allowedMentions: { repliedUser: false }
            }).catch(err => console.error('Error al responder:', err));
        }
    }
};
