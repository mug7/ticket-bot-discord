require('dotenv').config();
const discord = require('discord.js');
const { ticketChannelId, adminChannelId, ticketPrefix } = require('./config.json');

const decx = new discord.Client({
	intents: [
		discord.GatewayIntentBits.DirectMessages,
		discord.GatewayIntentBits.Guilds,
		discord.GatewayIntentBits.GuildBans,
		discord.GatewayIntentBits.GuildMessages,
		discord.GatewayIntentBits.MessageContent,
	],
	partials: [discord.Partials.Channel],
});

decx.on('ready', () => {
	const status = [
		'🥇 Focado no melhor RP :)',
		'💌 Contato: \n https://discord.gg/U4VhXcF4vP.',
		'🔨 Os melhores mods \n estão aqui.'
	];
	i = 0;
	decx.user.setActivity(status[0]);
	setInterval(() => decx.user.setActivity(`${status[i++ % status.length]}`, {
		type: 'PLAYING',
	}), 1000 * 60 * 15);
	decx.user.setStatus('online');
	console.log('😍 ' + decx.user.username + ' started working!');
});

decx.on('messageCreate', async (msg) => {
	if (msg.author.bot) return;
	if (!msg.member.permissions.has('ADMINISTRATOR')) return;
	if (msg.channel.type === 'dm') return;

	const prefix = ticketPrefix;

	if (!msg.content.startsWith(prefix)) return;
	const ticketChannel = decx.channels.cache.find(channel => channel.id === ticketChannelId);
	msg.delete();
	const row = new discord.ActionRowBuilder()
		.addComponents(
			new discord.ButtonBuilder()
				.setCustomId('ticket')
				.setLabel('✉️ Criar Ticket')
				.setStyle('Secondary'),
		);

	const embed = new discord.EmbedBuilder()
		.setColor('#2f3136')
		.setImage('https://cdn.discordapp.com/attachments/1010968972683911289/1010978160797560933/BVC_1.png')
		.setAuthor({ name: 'Criar ticket de atendimento | BVC', iconURL: 'https://cdn.discordapp.com/attachments/1010968972683911289/1010978160797560933/BVC_1.png', url: 'https://discord.gg/U4VhXcF4vP' })
		.setURL('https://discord.gg/U4VhXcF4vP')
		.setDescription('Para dúvidas, suporte, compras de vips e denúncias')
		.setFooter({ text: 'MTzin © 2022', iconURL: 'https://cdn.discordapp.com/attachments/1010968972683911289/1010978160797560933/BVC_1.png' });

	ticketChannel.send({ ephemeral: true, embeds: [embed], components: [row] });
});

decx.on('interactionCreate', async interaction => {
	if (interaction.customId === 'ticket') {
		if (!interaction.isButton()) return;
		const guild = decx.guilds.cache.get(interaction.guild.id);
		const guildChannels = guild.channels.cache;
		const userFirstName = interaction.user.username.split(' ')[0].toLowerCase();
		const interactionChannelName = `ticket-${userFirstName}`;
		const adminAlertChannel = decx.channels.cache.find(channel => channel.id === adminChannelId);
		const errorEmbed = new discord.EmbedBuilder()
			.setDescription('❌ | Você já possui um ticket aberto! Encerre o ticket atual para poder abrir um novo.')
			.setColor('#2f3136')
			.setFooter({ text: 'MTzin © 2022', iconURL: 'https://cdn.discordapp.com/attachments/1010968972683911289/1010978160797560933/BVC_1.png' });

		const sucessEmbed = new discord.EmbedBuilder()
			.setDescription('✅ | Você foi mencionado no canal correspondente ao seu ticket.')
			.setColor('#2f3136')
			.setFooter({ text: 'MTzin © 2022', iconURL: 'https://cdn.discordapp.com/attachments/1010968972683911289/1010978160797560933/BVC_1.png' });

		const adminMessage = new discord.EmbedBuilder()
			.setDescription(`☄️ Um ticket foi aberto! ${interaction.user.id}`)
			.addFields([
				{
					name: '😀 | Usuário:',
					value: `${interaction.user.username}`,
					inline: true
				}
			])
			.setColor('#2f3136')
			.setFooter({ text: 'MTzin © 2022', iconURL: 'https://cdn.discordapp.com/attachments/1010968972683911289/1010978160797560933/BVC_1.png' });

		for (const channel of guildChannels.values()) {
			if(channel.name.startsWith('ticket')) {
				if(channel.topic === interaction.user.id) {
					return interaction.reply({ ephemeral: true, embeds: [errorEmbed] });
				}
			}
		}

		adminAlertChannel.send({ ephemeral: true, embeds: [adminMessage] });

		guild.channels.create({
			name: interactionChannelName,
			permissionOverwrites: [
				{
					id: interaction.user.id,
					allow: [discord.PermissionFlagsBits.SendMessages, discord.PermissionFlagsBits.ViewChannel],
				},
				{
					id: interaction.guild.roles.everyone,
					deny: [discord.PermissionFlagsBits.ViewChannel],
				}
			],
			type: discord.ChannelType.GuildText,
			//parent: 'xxx',
		}).then(async channel => {
			channel.setTopic(interaction.user.id);
			const embed = new discord.EmbedBuilder()
				.setDescription('☄️ | Você solicitou um ticket. Entraremos em contato o mais rápido possível, aguarde. Clique no botão vermelho para encerrar o ticket.')
				.setColor('#2f3136')
				.setFooter({ text: 'MTzin © 2022', iconURL: 'https://cdn.discordapp.com/attachments/1010968972683911289/1010978160797560933/BVC_1.png' });

			const deleteButton = new discord.ActionRowBuilder()
				.addComponents(
					new discord.ButtonBuilder()
						.setCustomId('delete')
						.setLabel('Cancelar Ticket')
						.setStyle('Danger'),
				);

			await channel.send({ ephemeral: true, embeds: [embed], components: [deleteButton], content: `||<@${interaction.user.id}>||` });
			interaction.reply({ ephemeral: true, embeds: [sucessEmbed] });
		})
	}
	if (interaction.customId === 'delete') {
		interaction.channel.delete();
		const adminAlertChannel = decx.channels.cache.find(channel => channel.id === adminChannelId);
		const deleteMessage = new discord.EmbedBuilder()
			.setDescription(`❌ | Ticket encerrado! ${interaction.user.id}`)
			.addFields([
				{
					name: '😀 Usuário:',
					value: `${interaction.user.username}`,
					inline: true
				}
			])
			.setColor('#2f3136')
			.setFooter({ text: 'MTzin © 2022', iconURL: 'https://cdn.discordapp.com/attachments/1010968972683911289/1010978160797560933/BVC_1.png' });

		await interaction.user.send({ ephemeral: true, embeds: [deleteMessage] }).catch(() => {
			adminAlertChannel.send({ ephemeral: true, embeds: [deleteMessage] });
			return false;
		});
		adminAlertChannel.send({ ephemeral: true, embeds: [deleteMessage] });
	}
});
decx.login("MTAxNzEyNTg3NjA2NTkxNDk1MQ.G8Fgg3.ePf6Qx44KBo69c2TSBP4yMmYsI8QEcfpo4Mdns");