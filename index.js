const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const TOKEN = 'MTUwMzg2NDc4NTg5NTQyNDA4MQ.GNl7HI.9KCiCIYtVZtuyEIuyk4yz_oVKTj2bwFW-t1p_s';
const STAFF_ROLE_ID = '1503869458589024266'; // rol que ve los tickets
const TICKET_CATEGORY_ID = '1503807840471613631'; // categoría donde se crean los canales

// ── Catálogo ──────────────────────────────────────────────
const CATALOGO = [
  { robux: 200,    cop: '5,790',    usd: '1.5',  mxn: '27.7',   pen: '5.1'   },
  { robux: 500,    cop: '14,475',   usd: '3.75', mxn: '69.2',   pen: '12.7'  },
  { robux: 1000,   cop: '28,950',   usd: '7.5',  mxn: '138.5',  pen: '25.4'  },
  { robux: 2000,   cop: '57,900',   usd: '15',   mxn: '277.0',  pen: '50.7'  },
  { robux: 8000,   cop: '231,600',  usd: '60',   mxn: '1,108',  pen: '202.6' },
  { robux: 10000,  cop: '289,500',  usd: '75',   mxn: '1,385',  pen: '253.3' },
  { robux: 20000,  cop: '579,000',  usd: '150',  mxn: '2,770',  pen: '506.7' },
];

// ── Embed del catálogo ────────────────────────────────────
function buildCatalogoEmbed() {
  const embed = new EmbedBuilder()
    .setTitle('💎 Ashina Shop — Catálogo de Robux')
    .setColor(0x1e90ff)
    .setDescription(
      '✨ **Tienes libre elección** — puedes pedir un monto personalizado.\n' +
      '🌟 **Por compras en gran cantidad** se puede aplicar un descuento; consulta con el staff.\n\n' +
      '> ⚠️ PayPal **no** aceptado por ahora.\n\n' +
      '**💰 Precios actualizados:**'
    )
    .setFooter({ text: 'Ashina Shop | Confianza y rapidez 💙' });

  for (const item of CATALOGO) {
    embed.addFields({
      name: `🔘 ${item.robux.toLocaleString()} Robux`,
      value: `🇨🇴 ${item.cop} COP\n🇺🇸 ${item.usd} USD\n🇲🇽 ${item.mxn} MXN\n🇵🇪 ${item.pen} PEN`,
      inline: true,
    });
  }

  embed.addFields({
    name: '📦 Tipos de entrega',
    value:
      '• **Gamepass:** Recibirás los Robux en hasta 5 días.\n' +
      '• **Grupo:** El primer pago tarda ~3 días; después las entregas son inmediatas.',
    inline: false,
  });

  return embed;
}

// ── Embed confirmación de ticket ──────────────────────────
function buildTicketEmbed(user, robux, moneda) {
  return new EmbedBuilder()
    .setTitle('🛒 Nuevo ticket de compra')
    .setColor(0x00c851)
    .addFields(
      { name: 'Usuario', value: `${user}`, inline: true },
      { name: 'Cantidad', value: `${robux.toLocaleString()} Robux`, inline: true },
      { name: 'Moneda preferida', value: moneda, inline: true },
    )
    .setDescription('Un miembro del staff se comunicará contigo pronto. ¡No compartas contraseñas!')
    .setTimestamp()
    .setFooter({ text: 'Ashina Shop | Confianza y rapidez' });
}

// ── Registrar slash commands al arrancar ──────────────────
client.once('ready', async () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('catalogo')
      .setDescription('Muestra el catálogo de precios de Robux'),

    new SlashCommandBuilder()
      .setName('comprar')
      .setDescription('Inicia un ticket de compra de Robux')
      .addIntegerOption(opt =>
        opt.setName('robux')
          .setDescription('Cantidad de Robux que deseas comprar')
          .setRequired(true)
          .addChoices(
            ...CATALOGO.map(i => ({ name: `${i.robux.toLocaleString()} Robux`, value: i.robux }))
          )
      )
      .addStringOption(opt =>
        opt.setName('moneda')
          .setDescription('Tu moneda de preferencia')
          .setRequired(true)
          .addChoices(
            { name: '🇨🇴 COP (Peso colombiano)', value: 'COP' },
            { name: '🇺🇸 USD (Dólar)', value: 'USD' },
            { name: '🇲🇽 MXN (Peso mexicano)', value: 'MXN' },
            { name: '🇵🇪 PEN (Sol peruano)', value: 'PEN' },
          )
      ),

    new SlashCommandBuilder()
      .setName('cerrar')
      .setDescription('Cierra este ticket (solo staff)')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  ].map(cmd => cmd.toJSON());

  await client.application.commands.set(commands);
  console.log('📋 Comandos registrados.');
});

// ── Manejar interacciones ─────────────────────────────────
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // /catalogo
  if (interaction.commandName === 'catalogo') {
    await interaction.reply({ embeds: [buildCatalogoEmbed()] });
  }

  // /comprar
  if (interaction.commandName === 'comprar') {
    const robux = interaction.options.getInteger('robux');
    const moneda = interaction.options.getString('moneda');
    const guild = interaction.guild;
    const user = interaction.user;

    // Crear canal de ticket
    const channel = await guild.channels.create({
      name: `ticket-${user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      type: ChannelType.GuildText,
      parent: TICKET_CATEGORY_ID || null,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ...(STAFF_ROLE_ID
          ? [{ id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }]
          : []),
      ],
    });

    const cerrarBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('cerrar_ticket')
        .setLabel('🔒 Cerrar ticket')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `${user} ${STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}>` : ''}`,
      embeds: [buildTicketEmbed(user, robux, moneda)],
      components: [cerrarBtn],
    });

    await interaction.reply({
      content: `✅ Tu ticket fue creado: ${channel}`,
      ephemeral: true,
    });
  }

  // /cerrar
  if (interaction.commandName === 'cerrar') {
    const channel = interaction.channel;
    if (!channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: '❌ Esto solo funciona en canales de ticket.', ephemeral: true });
    }
    await interaction.reply('🔒 Cerrando ticket en 5 segundos...');
    setTimeout(() => channel.delete().catch(console.error), 5000);
  }
});

// Botón cerrar dentro del ticket
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId === 'cerrar_ticket') {
    await interaction.reply('🔒 Cerrando ticket en 5 segundos...');
    setTimeout(() => interaction.channel.delete().catch(console.error), 5000);
  }
});

client.login(TOKEN);
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // /catalogo
  if (interaction.commandName === 'catalogo') {
    await interaction.reply({ embeds: [buildCatalogoEmbed()] });
  }

  // /comprar
  if (interaction.commandName === 'comprar') {
    const robux = interaction.options.getInteger('robux');
    const moneda = interaction.options.getString('moneda');
    const guild = interaction.guild;
    const user = interaction.user;

    // Crear canal de ticket
    const channel = await guild.channels.create({
      name: `ticket-${user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      type: ChannelType.GuildText,
      parent: TICKET_CATEGORY_ID || null,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ...(STAFF_ROLE_ID
          ? [{ id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }]
          : []),
      ],
    });

    const cerrarBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('cerrar_ticket')
        .setLabel('🔒 Cerrar ticket')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `${user} ${STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}>` : ''}`,
      embeds: [buildTicketEmbed(user, robux, moneda)],
      components: [cerrarBtn],
    });

    await interaction.reply({
      content: `✅ Tu ticket fue creado: ${channel}`,
      ephemeral: true,
    });
  }

  // /cerrar
  if (interaction.commandName === 'cerrar') {
    const channel = interaction.channel;
    if (!channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: '❌ Esto solo funciona en canales de ticket.', ephemeral: true });
    }
    await interaction.reply('🔒 Cerrando ticket en 5 segundos...');
    setTimeout(() => channel.delete().catch(console.error), 5000);
  }
});

// Botón cerrar dentro del ticket
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId === 'cerrar_ticket') {
    await interaction.reply('🔒 Cerrando ticket en 5 segundos...');
    setTimeout(() => interaction.channel.delete().catch(console.error), 5000);
  }
});

client.login(TOKEN);

