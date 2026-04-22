// ticket interaction event
const { ActionRowBuilder, AttachmentBuilder, ContainerBuilder, StringSelectMenuBuilder, MessageFlags, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { randomUUID } = require('crypto');
const Ticket = require('../models/ticketModel');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isButton() && interaction.customId === 'close_ticket') {
            const channel = interaction.channel;
            if (channel.name.startsWith('ticket-')) {
                // Obtener el ticket de la base de datos
                const ticketId = channel.name.split('-')[1];
                const ticket = await Ticket.findOne({ ticketId: ticketId });

                if (ticket) {
                    // Generar transcript
                    const messages = await channel.messages.fetch({ limit: 100 });
                    const transcript = messages.reverse().map(msg => {
                        const timestamp = msg.createdAt.toISOString();
                        const author = msg.author.username;
                        const content = msg.content || '[Mensaje con contenido no textual]';
                        return `[${timestamp}] ${author}: ${content}`;
                    }).join('\n');

                    // Actualizar el ticket en la base de datos
                    await Ticket.findOneAndUpdate(
                        { ticketId: ticketId },
                        { status: 'closed', closedAt: new Date(), transcript: transcript }
                    );

                    // Enviar transcript al canal de logs
                    const transcriptChannelId = process.env.TICKET_TRANSCRIPT_CHANNEL_ID;
                    if (transcriptChannelId) {
                        try {
                            const transcriptChannel = await client.channels.fetch(transcriptChannelId);
                            if (transcriptChannel?.isTextBased()) {
                                const transcriptFile = new AttachmentBuilder(Buffer.from(transcript, 'utf-8'), {
                                    name: `ticket-${ticketId}-transcript.txt`,
                                });

                                await transcriptChannel.send({
                                    content: `Transcript del ticket **${ticketId}** creado por <@${ticket.userId}>. Categoría: **${ticket.category}**`,
                                    files: [transcriptFile],
                                });
                            } else {
                                console.warn('⚠️  Canal de transcript no es de texto o no se pudo encontrar.');
                            }
                        } catch (error) {
                            console.error('Error al enviar el transcript al canal:', error);
                        }
                    } else {
                        console.warn('⚠️  TICKET_TRANSCRIPT_CHANNEL_ID no está configurado en .env.');
                    }
                }

                try {
                    await channel.delete();
                } catch (error) {
                    console.error('Error al eliminar el canal del ticket:', error);
                }
            }
            return;
        }

        if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_')) {
            const selectedCategory = interaction.customId.replace('ticket_modal_', '');
            const categoryName = {
                general_support: 'Soporte General',
                buy_products: 'Comprar Productos',
                payments_billing: 'Pagos y Facturación',
                report_issue: 'Reportar un Problema'
            }[selectedCategory] || 'Categoría Desconocida';
            const user = interaction.user;
            const guild = interaction.guild;

            let description;
            if (selectedCategory === 'buy_products') {
                const product = interaction.fields.getTextInputValue('product');
                const quantity = interaction.fields.getTextInputValue('quantity');
                description = `**Producto:** ${product}\n**Cantidad:** ${quantity}`;
            } else {
                description = interaction.fields.getTextInputValue('description');
            }

            // Generar un ID único para el ticket
            const ticketId = randomUUID().split('-')[0].toUpperCase();

            // Crear un nuevo canal de texto para el ticket
            const channelName = `ticket-${ticketId}`;
            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: 0, // Canal de texto
                parent: '1496390018984579143', // Reemplaza con el ID de la categoría donde quieres que se creen los tickets
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: ['ViewChannel'],
                    },
                    {
                        id: user.id,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                    },
                    // Aquí puedes agregar permisos para el rol del staff si lo deseas
                ],
            });

            // Guardar el ticket en la base de datos
            const newTicket = new Ticket({
                ticketId: ticketId,
                userId: user.id,
                category: selectedCategory,
                channelId: ticketChannel.id,
                guildId: guild.id,
            });
            await newTicket.save();

            // Enviar un mensaje de bienvenida en el canal del ticket
            const welcomeContainer = new ContainerBuilder()
                .setAccentColor(0x222222)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent('### Ticket de ' + categoryName + '\n\n**Ticket ID:** `' + ticketId + '`\n\nPor favor, ten paciencia mientras el equipo revisa tu solicitud.'),
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent('Un miembro del equipo responderá tan pronto como esté disponible. Permanece en este canal para recibir actualizaciones.'),
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent('**Descripción del Problema:**\n' + description),
                )
                .addSeparatorComponents((separator) => separator)
                .addTextDisplayComponents((textDisplay) =>
                    textDisplay.setContent('-# © 2026 Prime Quality. Todos los derechos reservados.'),
                );

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Cerrar Ticket')
                .setStyle(2);

            await ticketChannel.send({
                components: [welcomeContainer, new ActionRowBuilder().addComponents(closeButton)],
                flags: MessageFlags.IsComponentsV2
            });

            // Responder a la interacción para confirmar que el ticket ha sido creado
            await interaction.reply({
                content: `Tu ticket ha sido creado: ${ticketChannel}`,
                flags: MessageFlags.Ephemeral,
            });
        }

        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category') {
            const selectedCategory = interaction.values[0];
            const categoryName = {
                general_support: 'Soporte General',
                buy_products: 'Comprar Productos',
                payments_billing: 'Pagos y Facturación',
                report_issue: 'Reportar un Problema'
            }[selectedCategory] || 'Categoría Desconocida';

            // Crear un modal basado en la categoría
            const modal = new ModalBuilder()
                .setCustomId(`ticket_modal_${selectedCategory}`)
                .setTitle('Describe tu problema');

            if (selectedCategory === 'buy_products') {
                const productInput = new TextInputBuilder()
                    .setCustomId('product')
                    .setLabel('Producto que deseas comprar')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: Netflix')
                    .setRequired(true)
                    .setMaxLength(100);

                const quantityInput = new TextInputBuilder()
                    .setCustomId('quantity')
                    .setLabel('Cantidad')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Ej: 5')
                    .setRequired(true)
                    .setMaxLength(10);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(productInput),
                    new ActionRowBuilder().addComponents(quantityInput)
                );
            } else {
                const descriptionInput = new TextInputBuilder()
                    .setCustomId('description')
                    .setLabel('Descripción del problema')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Por favor, describe tu problema o consulta en detalle...')
                    .setRequired(true)
                    .setMaxLength(1000);

                modal.addComponents(new ActionRowBuilder().addComponents(descriptionInput));
            }

            await interaction.showModal(modal);
        }
    },
};