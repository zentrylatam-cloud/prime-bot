require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

// Configurar Mongoose
mongoose.set('strictQuery', false);

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('✅ Conectado a MongoDB');
}).catch((err) => {
    console.error('❌ Error al conectar a MongoDB:', err);
    process.exit(1);
});

// Importar handlers
const eventsHandler = require('./handlers/eventsHandler');
const slashCommandHandler = require('./handlers/slashCommandHandler');
const prefixCommandHandler = require('./handlers/prefixCommandHandler');

// Crear cliente con intents necesarios
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

// Evento especial para cargar handlers cuando el cliente esté listo
client.once('clientReady', async (readyClient) => {

    // Cargar slash commands cuando el cliente esté listo
    await slashCommandHandler(readyClient);

    // Cargar prefix commands
    prefixCommandHandler(readyClient);
});

// Cargar todos los eventos automáticamente
eventsHandler(client);

// Login con el token
if (!process.env.TOKEN) {
    console.error('❌ Error: TOKEN no está definido en .env');
    process.exit(1);
}

client.login(process.env.TOKEN);
