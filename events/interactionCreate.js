const { MessageFlags } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Manejar slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.slashCommands?.get(interaction.commandName);
            if (!command) {
                console.warn(`⚠️  Comando slash no encontrado: ${interaction.commandName}`);
                return;
            }

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error('❌ Error al ejecutar slash command:', error);
                if (!interaction.replied) {
                    await interaction.reply({
                        content: 'Hubo un error al ejecutar el comando.',
                        flags: MessageFlags.Ephemeral
                    });
                } else {
                    await interaction.followUp({
                        content: 'Hubo un error al ejecutar el comando.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
        }

        // Manejar botones
        if (interaction.isButton()) {
            // Skip ticket-related buttons handled elsewhere
            if (interaction.customId === 'close_ticket') return;

            const buttonCommand = client.buttons?.get(interaction.customId);

            if (!buttonCommand) {
                console.warn(`⚠️  Botón no encontrado: ${interaction.customId}`);
                return;
            }

            try {
                await buttonCommand.execute(interaction, client);
            } catch (error) {
                console.error('❌ Error al ejecutar botón:', error);
                if (!interaction.replied) {
                    await interaction.reply({
                        content: 'Hubo un error al procesar el botón.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
        }
    }
};
