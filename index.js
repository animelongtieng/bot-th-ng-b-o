
require("dotenv").config();

const fs = require("fs");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const DATA_FILE = "./dangky.json";

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      projects: {}
    }, null, 2));
  }

  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(data, null, 2)
  );
}

client.once("ready", () => {
  console.log(`Bot online: ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {

  // TẠO THÔNG BÁO
  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === "taothongbao"
  ) {

    if (
      !interaction.memberPermissions.has(
        PermissionFlagsBits.Administrator
      )
    ) {
      return interaction.reply({
        content: "Bạn không có quyền sử dụng lệnh này!",
        ephemeral: true
      });
    }

    const content =
      interaction.options.getString("noi-dung");

    const id = Date.now().toString(36);

    const embed = new EmbedBuilder()
      .setColor("#39A9DB")
      .setTitle("🎬 ĐĂNG KÝ PHIM LỒNG TIẾNG")
      .setDescription(content)
      .addFields({
        name: "🎙️ Đăng ký",
        value: "Nhấn nút bên dưới để tham gia dự án."
      })
      .setFooter({
        text: "AnimeLongTieng"
      })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`dangky_${id}`)
          .setLabel("Đăng ký tham gia")
          .setEmoji("🎙️")
          .setStyle(ButtonStyle.Primary)
      );

    const message = await interaction.channel.send({
      embeds: [embed],
      components: [row]
    });

    const data = loadData();

    data.projects[id] = {
      content,
      channelId: interaction.channelId,
      messageId: message.id,
      applicants: [],
      closed: false
    };

    saveData(data);

    return interaction.reply({
      content: "✅ Đã tạo thông báo đăng ký!",
      ephemeral: true
    });
  }

  // MEMBER ĐĂNG KÝ
  if (
    interaction.isButton() &&
    interaction.customId.startsWith("dangky_")
  ) {

    const id = interaction.customId.replace(
      "dangky_", ""
    );

    const data = loadData();
    const project = data.projects[id];

    if (!project || project.closed) {
      return interaction.reply({
        content: "Đợt đăng ký đã đóng!",
        ephemeral: true
      });
    }

    const exists = project.applicants.some(
      user => user.id === interaction.user.id
    );

    if (exists) {
      return interaction.reply({
        content: "Bạn đã đăng ký dự án này rồi!",
        ephemeral: true
      });
    }

    project.applicants.push({
      id: interaction.user.id,
      username: interaction.user.username,
      time: new Date().toISOString()
    });

    saveData(data);

    // TÌM KÊNH NGƯỜI ĐĂNG KÝ
    const channel = interaction.guild.channels.cache
      .find(c => c.name === "nguoi-dang-ky");

    if (channel) {
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#54B889")
            .setTitle("🎙️ THÀNH VIÊN ĐĂNG KÝ")
            .addFields(
              {
                name: "👤 Thành viên",
                value: `${interaction.user}`
              },
              {
                name: "🎬 Dự án",
                value: project.content.slice(0, 1000)
              }
            )
            .setTimestamp()
        ]
      });
    }

    return interaction.reply({
      content: "✅ Đăng ký thành công!",
      ephemeral: true
    });
  }

});

client.login(process.env.DISCORD_TOKEN);
