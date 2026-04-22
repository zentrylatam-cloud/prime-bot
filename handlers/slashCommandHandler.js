const fs = require('fs');
const path = require('path');
const { REST } = require('discord.js');
const { Routes } = require('discord.js');

module.exports = async (client) => {
    const commandsPath = path.join(__dirname, '..', 'commands', 'slash');

    if (!fs.existsSync(commandsPath)) {
        console.warn(`⚠️  La carpeta de slash commands no existe: ${commandsPath}`);
        return;
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    const commands = [];

    client.slashCommands = new Map();

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if (!command.data || !command.execute) {
            console.warn(`⚠️  El comando ${file} no tiene 'data' o 'execute'`);
            continue;
        }

        client.slashCommands.set(command.data.name, command);
        commands.push(command.data.toJSON());
        console.log(`✅ Slash command cargado: ${command.data.name}`);
    }

    // Registrar comandos con Discord
    if (commandFiles.length > 0) {
        try {
            const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

            const guildId = process.env.GUILD_ID;
            const clientId = client.user?.id || process.env.CLIENT_ID;

            if (guildId) {
                // Registrar solo en el servidor de desarrollo
                await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: commands }
                );
                console.log(`✅ Slash commands registrados en el guild: ${guildId}`);
            } else {
                // Registrar globalmente
                await rest.put(
                    Routes.applicationCommands(clientId),
                    { body: commands }
                );
                console.log(`✅ Slash commands registrados globalmente`);
            }
        } catch (error) {
            console.error('❌ Error al registrar slash commands:', error);
        }
    }
};
