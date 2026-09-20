import 'dotenv/config';

import {
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits
} from 'discord.js';

const {
  DISCORD_TOKEN,
  CLIENT_ID,
  GUILD_IDS
} = process.env;

if (
  !DISCORD_TOKEN ||
  !CLIENT_ID ||
  !GUILD_IDS
) {
  throw new Error(
    'Faltan DISCORD_TOKEN, CLIENT_ID o GUILD_IDS en .env'
  );
}

const commands = [

  new SlashCommandBuilder()
    .setName('help')
    .setDescription(
      'Muestra la ayuda del bot'
    ),

  new SlashCommandBuilder()
    .setName('horas')
    .setDescription(
      'Muestra las horas acumuladas en voz'
    )
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription(
          'Usuario que quieres consultar'
        )
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('ranking')
    .setDescription(
      'Muestra el ranking de horas en voz'
    ),

  new SlashCommandBuilder()
    .setName('crear')
    .setDescription(
      'Crea un canal de voz'
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageChannels
    ),

  new SlashCommandBuilder()
    .setName('borrar')
    .setDescription(
      'Elimina mensajes del canal'
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageMessages
    )
    .addIntegerOption(option =>
      option
        .setName('cantidad')
        .setDescription(
          'Cantidad de mensajes a eliminar'
        )
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  new SlashCommandBuilder()
    .setName('borrados')
    .setDescription(
      'Muestra mensajes eliminados recientemente'
    )

].map(command => command.toJSON());

const guildIds = GUILD_IDS
  .split(',')
  .map(id => id.trim())
  .filter(Boolean);

const rest =
  new REST({ version: '10' })
    .setToken(DISCORD_TOKEN);

for (const guildId of guildIds) {

  await rest.put(
    Routes.applicationGuildCommands(
      CLIENT_ID,
      guildId
    ),
    {
      body: commands
    }
  );

  console.log(
    `✅ Comandos registrados en: ${guildId}`
  );
}

console.log(
  `✅ Listo: ${guildIds.length} servidor(es) configurado(s).`
);