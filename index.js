import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits
} from 'discord.js';
import fs from 'node:fs';
import { joinVoiceChannel } from '@discordjs/voice'; 
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const DATA_FILE = './data.json';

let data = {};

if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    data = {};
  }
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const channelOwners = new Map();
const voiceSessions = new Map();

// Mensajes borrados guardados en memoria
const deletedMessages = new Map();

function getUserData(userId) {
  if (!data[userId]) {
    data[userId] = {
      totalSeconds: 0
    };
  }

  return data[userId];
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${hours}h ${minutes}m`;
}

function createControlPanel(channelId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`lock_${channelId}`)
      .setLabel('Bloquear')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`unlock_${channelId}`)
      .setLabel('Desbloquear')
      .setEmoji('🔓')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`rename_${channelId}`)
      .setLabel('Cambiar nombre')
      .setEmoji('✏️')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`kick_${channelId}`)
      .setLabel('Sacar')
      .setEmoji('👢')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId(`delete_${channelId}`)
      .setLabel('Eliminar')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger)
  );
}

client.once('clientReady', () => {
  console.log(`✅ Conectado como ${client.user.tag}`);
});

// ======================================
// MENSAJES BORRADOS
// ======================================

client.on('messageDelete', message => {
  if (!message.guild) return;
  if (message.author?.bot) return;

  if (!deletedMessages.has(message.guild.id)) {
    deletedMessages.set(message.guild.id, []);
  }

  const messages = deletedMessages.get(message.guild.id);

  messages.unshift({
    authorId: message.author?.id,
    authorName: message.author?.username || 'Desconocido',
    content: message.content || '[Sin contenido de texto]',
    channelName: message.channel?.name || 'Canal desconocido',
    channelId: message.channel?.id,
    timestamp: Date.now()
  });

  // Guardamos solamente los últimos 20
  if (messages.length > 20) {
    messages.length = 20;
  }

  console.log(
    `🗑️ Mensaje eliminado de ${message.author?.username}: ${message.content}`
  );
});

// ======================================
// HORAS EN VOZ
// ======================================

client.on('voiceStateUpdate', (oldState, newState) => {
  const userId = newState.id;

  // Entró a voz
  if (!oldState.channelId && newState.channelId) {
    voiceSessions.set(userId, Date.now());
  }

  // Salió de voz
  if (oldState.channelId && !newState.channelId) {
    const start = voiceSessions.get(userId);

    if (start) {
      const seconds = Math.floor((Date.now() - start) / 1000);

      const userData = getUserData(userId);
      userData.totalSeconds += seconds;

      saveData();
      voiceSessions.delete(userId);
    }
  }
});

// ======================================
// INTERACCIONES
// ======================================
// ======================================
// INTERACCIONES
// ======================================
// ======================================

// aquí empieza messageCreate
client.on('messageCreate', async message => { 
  if (message.author.bot) return;

  const args = message.content.trim().split(/\s+/);
  const command = args[0].toLowerCase();
if (command === '.join' || command === 'xjoin') {
  const canal = message.member.voice.channel;

  if (!canal) {
    return message.reply('❌ Primero entra a un canal de voz.');
  }

  joinVoiceChannel({
    channelId: canal.id,
    guildId: canal.guild.id,
    adapterCreator: canal.guild.voiceAdapterCreator,
  });

  return message.reply(`🔊 Entré a **${canal.name}**.`);
}
  if (command === '.kick' || command === 'xkick') {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('❌ No tienes permiso para expulsar miembros.');
    }

    const target = message.mentions.members.first();

    if (!target) {
      return message.reply('❌ Usa `.kick @usuario`');
    }

    if (!target.kickable) {
      return message.reply('❌ No puedo expulsar a ese usuario.');
    }

    await target.kick(`Expulsado por ${message.author.username}`);

    return message.reply(`👢 **${target.user.username}** fue expulsado.`);
  }
});
client.on('interactionCreate', async interaction => {
  try { 


    // ==================================
    // SLASH COMMANDS
    // ==================================

    if (interaction.isChatInputCommand()) {

      // /help
      if (interaction.commandName === 'help') {
        const embed = new EmbedBuilder()
          .setTitle('L8 Niño polla')
          .setDescription(
            '**Comandos disponibles:**\n\n' +
            '`/crear` — Crea tu sala de voz\n' +
            '`/horas` — Mira tus horas en voz\n' +
            '`/ranking` — Ranking de horas\n' +
            '`/borrar` — Elimina mensajes\n' +
            '`/borrados` — Mira mensajes eliminados'
          );

        return interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      // /horas
      if (interaction.commandName === 'horas') {
        const user =
          interaction.options.getUser('usuario') ||
          interaction.user;

        const userData = getUserData(user.id);

        return interaction.reply(
          `⏱️ **${user.username}** lleva **${formatTime(
            userData.totalSeconds
          )}** en canales de voz.`
        );
      }

      // /ranking
      if (interaction.commandName === 'ranking') {
        const ranking = Object.entries(data)
          .sort((a, b) => b[1].totalSeconds - a[1].totalSeconds)
          .slice(0, 10);

        if (ranking.length === 0) {
          return interaction.reply(
            'Todavía no hay horas registradas.'
          );
        }

        let text = '';

        for (let i = 0; i < ranking.length; i++) {
          const [userId, userData] = ranking[i];

          const member = await interaction.guild.members
            .fetch(userId)
            .catch(() => null);

          const name =
            member?.user?.username ||
            `Usuario ${userId}`;

          text += `**${i + 1}. ${name}** — ${formatTime(
            userData.totalSeconds
          )}\n`;
        }

        return interaction.reply(
          `🏆 **Ranking de horas en voz**\n\n${text}`
        );
      }

      // /crear
      if (interaction.commandName === 'crear') {

        const guild = interaction.guild;

        const existingChannel = [...channelOwners.entries()]
          .find(([channelId, ownerId]) =>
            ownerId === interaction.user.id &&
            guild.channels.cache.has(channelId)
          );

        if (existingChannel) {
          return interaction.reply({
            content: '❌ Ya tienes una sala creada.',
            ephemeral: true
          });
        }

        const channel = await guild.channels.create({
          name: `Sala de ${interaction.user.username}`,
          type: ChannelType.GuildVoice,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect
              ]
            }
          ]
        });

        channelOwners.set(
          channel.id,
          interaction.user.id
        );

        if (interaction.member.voice.channel) {
          await interaction.member.voice.setChannel(channel);
        }

        const embed = new EmbedBuilder()
          .setTitle('Tu sala de voz')
          .setDescription(
            `**Canal:** ${channel}\n\n` +
            'Usa los botones para administrar tu sala.'
          );

        return interaction.reply({
          embeds: [embed],
          components: [createControlPanel(channel.id)],
          ephemeral: true
        });
      }

      // ==================================
      // /BORRAR
      // ==================================

      if (interaction.commandName === 'borrar') {

        const cantidad =
          interaction.options.getInteger('cantidad');

        if (
          !interaction.member.permissions.has(
            PermissionFlagsBits.ManageMessages
          )
        ) {
          return interaction.reply({
            content:
              '❌ Necesitas el permiso **Gestionar mensajes**.',
            ephemeral: true
          });
        }

        const mensajes =
          await interaction.channel.messages.fetch({
            limit: cantidad
          });

        const eliminables = mensajes.filter(
          message =>
            Date.now() - message.createdTimestamp <
            14 * 24 * 60 * 60 * 1000
        );

        if (eliminables.size === 0) {
          return interaction.reply({
            content:
              '❌ No encontré mensajes que pueda eliminar.',
            ephemeral: true
          });
        }

        await interaction.channel.bulkDelete(
          eliminables,
          true
        );

        const respuesta = await interaction.reply({
          content: `🗑️ Se eliminaron **${eliminables.size} mensajes**.`,
          fetchReply: true
        });

        setTimeout(() => {
          respuesta.delete().catch(() => {});
        }, 5000);

        return;
      }

      // ==================================
      // /BORRADOS
      // ==================================

      if (interaction.commandName === 'borrados') {

        const messages =
          deletedMessages.get(interaction.guild.id) || [];

        if (messages.length === 0) {
          return interaction.reply({
            content:
              '📭 No tengo mensajes borrados registrados todavía.',
            ephemeral: true
          });
        }

        const recientes = messages.slice(0, 10);

        const embed = new EmbedBuilder()
          .setTitle('🗑️ Mensajes eliminados')
          .setDescription(
            recientes.map((msg, index) => {
              const contenido =
                msg.content.length > 500
                  ? msg.content.slice(0, 500) + '...'
                  : msg.content;

              return (
                `**${index + 1}. ${msg.authorName}**\n` +
                `📍 #${msg.channelName}\n` +
                `💬 ${contenido}\n`
              );
            }).join('\n')
          )
          .setFooter({
            text: 'Se muestran los últimos 10 mensajes registrados.'
          });

        return interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }
    }

    // ==================================
    // BOTONES
    // ==================================

    if (interaction.isButton()) {

      const [action, channelId] =
        interaction.customId.split('_');

      const channel =
        interaction.guild.channels.cache.get(channelId);

      if (!channel) {
        return interaction.reply({
          content: '❌ Esa sala ya no existe.',
          ephemeral: true
        });
      }

      const ownerId =
        channelOwners.get(channelId);

      if (ownerId !== interaction.user.id) {
        return interaction.reply({
          content:
            '❌ Solo el dueño de la sala puede usar estos controles.',
          ephemeral: true
        });
      }

      // Bloquear
      if (action === 'lock') {

        await channel.permissionOverwrites.edit(
          interaction.guild.roles.everyone,
          {
            Connect: false
          }
        );

        await channel.permissionOverwrites.edit(
          interaction.user.id,
          {
            Connect: true,
            ViewChannel: true
          }
        );

        return interaction.reply({
          content: '🔒 Sala bloqueada.',
          ephemeral: true
        });
      }

      // Desbloquear
      if (action === 'unlock') {

        await channel.permissionOverwrites.edit(
          interaction.guild.roles.everyone,
          {
            Connect: null
          }
        );

        return interaction.reply({
          content: '🔓 Sala desbloqueada.',
          ephemeral: true
        });
      }

      // Cambiar nombre
      if (action === 'rename') {

        await interaction.reply({
          content:
            '✏️ Escribe el nuevo nombre de la sala aquí. Tienes 30 segundos.',
          ephemeral: true
        });

        const filter = message =>
          message.author.id === interaction.user.id;

        const collector =
          interaction.channel.createMessageCollector({
            filter,
            time: 30000,
            max: 1
          });

        collector.on('collect', async message => {

          const newName =
            message.content.trim().slice(0, 100);

          if (!newName) return;

          await channel.setName(newName);

          await message.delete().catch(() => {});

          await interaction.followUp({
            content:
              `✅ Ahora la sala se llama **${newName}**.`,
            ephemeral: true
          });
        });

        return;
      }

      // Sacar
      if (action === 'kick') {

        const members =
          [...channel.members.values()]
            .filter(member => !member.user.bot);

        if (members.length === 0) {
          return interaction.reply({
            content:
              'No hay usuarios para sacar.',
            ephemeral: true
          });
        }

        const options = members
          .slice(0, 25)
          .map(member => ({
            label:
              member.user.username.slice(0, 100),
            value: member.id
          }));

        const menu =
          new StringSelectMenuBuilder()
            .setCustomId(
              `kickuser_${channelId}`
            )
            .setPlaceholder(
              'Selecciona un usuario'
            )
            .addOptions(options);

        const row =
          new ActionRowBuilder()
            .addComponents(menu);

        return interaction.reply({
          content:
            '👢 Selecciona al usuario que quieres sacar:',
          components: [row],
          ephemeral: true
        });
      }

      // Eliminar
      if (action === 'delete') {

        await channel.delete().catch(() => {});

        channelOwners.delete(channelId);

        return interaction.reply({
          content: '🗑️ Sala eliminada.',
          ephemeral: true
        });
      }
    }

    // ==================================
    // SELECT MENU
    // ==================================

    if (interaction.isStringSelectMenu()) {

      if (
        !interaction.customId.startsWith(
          'kickuser_'
        )
      ) return;

      const channelId =
        interaction.customId.replace(
          'kickuser_',
          ''
        );

      const channel =
        interaction.guild.channels.cache.get(
          channelId
        );

      if (!channel) {
        return interaction.reply({
          content:
            '❌ La sala ya no existe.',
          ephemeral: true
        });
      }

      const ownerId =
        channelOwners.get(channelId);

      if (
        ownerId !== interaction.user.id
      ) {
        return interaction.reply({
          content:
            '❌ No puedes administrar esta sala.',
          ephemeral: true
        });
      }

      const userId =
        interaction.values[0];

      const member =
        channel.members.get(userId);

      if (!member) {
        return interaction.reply({
          content:
            '❌ Ese usuario ya no está en la sala.',
          ephemeral: true
        });
      }

      await member.voice.disconnect(
        'Expulsado por el dueño de la sala'
      );

      return interaction.update({
        content:
          `👢 **${member.user.username}** fue expulsado.`,
        components: []
      });
    }

  } catch (error) {

    console.error('❌ Error:', error);

    if (
      !interaction.replied &&
      !interaction.deferred
    ) {
      await interaction.reply({
        content: '❌ Ocurrió un error.',
        ephemeral: true
      }).catch(() => {});
    }
  }
});

// ======================================
// ELIMINAR SALAS VACÍAS
// ======================================

setInterval(async () => {

  for (const [channelId] of channelOwners) {

    const channel =
      client.channels.cache.get(channelId);

    if (!channel) {
      channelOwners.delete(channelId);
      continue;
    }

    if (
      channel.type !==
      ChannelType.GuildVoice
    ) continue;

    if (channel.members.size === 0) {

      await channel.delete()
        .catch(() => {});

      channelOwners.delete(channelId);

      console.log(
        `🗑️ Sala vacía eliminada: ${channel.name}`
      );
    }
  }

}, 10000);

client.login(
  process.env.DISCORD_TOKEN
);