const { SlashCommandBuilder, ContainerBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketpanel')
        .setDescription('Create a ticket panel for support with language selection.')
        .setDefaultMemberPermissions(0),
    async execute(interaction) {
        const canal = interaction.channel;
        if (!canal) {
            return interaction.reply({ content: 'No se pudo encontrar el canal para enviar el panel.', flags: MessageFlags.Ephemeral });
        }
        const container = new ContainerBuilder()
            .setAccentColor(0x222222)
            .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent('### **¡Bienvenido al sistema de soporte de Prime Quality!**\nSi necesitas ayuda, por favor selecciona la opción que mejor se adapte a tu consulta.'),
            )
            .addSeparatorComponents((separator) => separator)
            .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent('Nuestro equipo de soporte está aquí para ayudarte con cualquier consulta o problema que puedas tener.\n\n**¡NO ENVÍES MENSAJES DIRECTOS AL STAFF!**'),
            )
            .addSeparatorComponents((separator) => separator)
            .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent('**Opciones de soporte disponibles:**\n\n1. **Soporte General** - Para preguntas y problemas generales.\n2. **Comprar Productos** - Para comprar productos de nuestra tienda.\n3. **Pagos y Facturación** - Para consultas relacionadas con pagos y facturación.\n4. **Reportar un Problema** - Para reportar problemas técnicos o errores.'),
            )
            .addSeparatorComponents((separator) => separator)
            .addTextDisplayComponents((textDisplay) =>
                textDisplay.setContent('-# © 2026 Prime Quality. Todos los derechos reservados.'),
            );

        const CategoryMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_category')
            .setPlaceholder('Selecciona la categoría de tu consulta')
            .addOptions([
                {
                    label: 'Soporte General',
                    description: 'Para preguntas y problemas generales.',
                    value: 'general_support',
                },
                {
                    label: 'Comprar Productos',
                    description: 'Para comprar productos de nuestra tienda.',
                    value: 'buy_products',
                },
                {
                    label: 'Pagos y Facturación',
                    description: 'Para consultas relacionadas con pagos y facturación.',
                    value: 'payments_billing',
                },
                {
                    label: 'Reportar un Problema',
                    description: 'Para reportar problemas técnicos o errores.',
                    value: 'report_issue',
                }
            ]);

        const row = new ActionRowBuilder().addComponents(CategoryMenu);

        try {
            await canal.send({
                components: [container, row],
                flags: MessageFlags.IsComponentsV2,
            });
            await interaction.reply({ content: 'Panel de tickets enviado correctamente.', flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('❌ Error al enviar el panel de tickets:', error);
            await interaction.reply({ content: 'Hubo un error al enviar el panel de tickets.', flags: MessageFlags.Ephemeral });
        }
    }
};
