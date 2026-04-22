const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const commandsPath = path.join(__dirname, '..', 'commands', 'prefix');

    if (!fs.existsSync(commandsPath)) {
        console.warn(`⚠️  La carpeta de prefix commands no existe: ${commandsPath}`);
        return;
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    client.prefixCommands = new Map();

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if (!command.name || !command.execute) {
            console.warn(`⚠️  El comando ${file} no tiene 'name' o 'execute'`);
            continue;
        }

        client.prefixCommands.set(command.name, command);

        // Agregar alias si existen
        if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach(alias => {
                client.prefixCommands.set(alias, command);
            });
        }

        console.log(`✅ Prefix command cargado: ${command.name}`);
    }
};
