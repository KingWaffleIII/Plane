"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const redis_1 = require("redis");
const config_json_1 = require("./config.json");
const wait = require("node:timers/promises").setTimeout;
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
    presence: {
        status: "online",
        activities: [
            {
                name: "mRAST",
                type: discord_js_1.ActivityType.Competing,
            },
        ],
    },
});
const realJoshId = "732584820387086366";
const responses = [
    "I'm better than you",
    "Ur trash",
    "I would roast you but my mom said that I'm not allowed to burn the trash",
    "Ur stupid",
    "Go study airrec",
    "Me >>> you",
];
client.on(discord_js_1.Events.ClientReady, (bot) => {
    console.log(`Bot is ready, logged in as ${bot.user.tag}!`);
});
client.on(discord_js_1.Events.MessageCreate, async (message) => {
    if (message.content.includes(`<@${client.user?.id}>`) ||
        message.content.includes(`<@${realJoshId}>`)) {
        await message.reply(responses[Math.floor(Math.random() * responses.length)]);
    }
});
async function listenForQuiz(message, channel) {
    if (message === "accept")
        return;
    const thread = (await client.channels.fetch(message));
    if (thread === null || thread?.archived)
        return;
    if (channel !== "josh-new-quiz")
        return;
    if (message === "end") {
        await thread.send(responses[Math.floor(Math.random() * responses.length)]);
        return;
    }
    const doQuiz = async (m, c) => {
        if (c !== "josh-do-quiz" || m === "end")
            return;
        await wait(8000);
        await thread.send(m);
        await thread.send(responses[Math.floor(Math.random() * responses.length)]);
    };
    const pub = (0, redis_1.createClient)({
        url: "redis://plane_redis:6379",
    });
    pub.on("error", (err) => console.error(err));
    await pub.connect();
    if (Math.floor(Math.random() * 10) === 1) {
        await wait(3000);
        await pub.publish("josh-new-quiz", "accept");
        await thread.send(responses[Math.floor(Math.random() * responses.length)]);
    }
    else {
        return;
    }
    const sub = pub.duplicate();
    sub.on("error", (err) => console.error(err));
    await sub.connect();
    await sub.subscribe("josh-do-quiz", doQuiz);
}
(async () => {
    await client.login(config_json_1.joshToken);
    const sub = (0, redis_1.createClient)({
        url: "redis://plane_redis:6379",
    });
    sub.on("error", (err) => console.error(err));
    await sub.connect();
    await sub.subscribe("josh-new-quiz", listenForQuiz);
})();
