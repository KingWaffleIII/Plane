# Plane

An extremely modular Discord bot designed to help RAF students with their RAFK (RAF Knowledge) and aircraft recognition.

## Usage & Invite

If you want to use the bot, we heavily recommend you use the bot hosted by Planet Waffle; you can do so [here](https://discord.com/api/oauth2/authorize?client_id=1044710491110522940&permissions=326417599488&scope=bot). This bot will always use the latest version from the main branch (I update the bot every time I merge a PR).

If you really want to host the bot yourself, you can do so by following these steps:
(note: Docker and Docker Compose are required to run the bot)

1. clone the repo
2. create `src/config.json` like so:

```json
{
	"token": "YOUR BOT TOKEN HERE",
	"clientId": "YOUR BOT CLIENT ID HERE"
}
```

3. run the `npm prod` script to compile the TypeScript code
4. run `docker compose up -d` to start the bot

## Waifus

Waifus are a complex, main [gacha](https://en.wikipedia.org/wiki/Gacha_game) feature of the bot.
There are two types of waifus: **aircraft** and **weapon**.

### Aircraft waifus

Aircraft waifus are the main type of waifu. They have an **ATK** (1-10), **HP** (1-20), and **SPD** (1-10) stat, which are randomly generated and use for [dogfighting](#Dogfighting). There is no bias for the stats - fighters can have high DEF stats but low ATK/SPD and freighters can have high ATK/SPD but low DEF.

### Weapon waifus

Weapon waifus are the secondary type of waifu. They have just a randomly generated **ATK** (1-10) stat which is intended to be used in conjunction with aircraft waifus in [dogfighting](#Dogfighting).

### Obtaining waifus

Waifus can be obtained in two ways depending on her type:

-   through `/airrec` (**spec** aircraft waifus)
-   winning airrec quizzes (**non-spec** aircraft waifus and weapon waifus)

With `/airrec`, there is a **~21% chance** of getting an **eligible** aircraft, and a further **33% chance** of a waifu spawning from that eligible aircraft. This means that there is a **~7% chance** of getting a waifu from `/airrec`.
With airrec quizzes, there is a **~33% chance** of getting a waifu **when you win a quiz**. To stop people spamming quizzes with just themselves, the quiz must have at least **3 players** and **5 rounds** to be eligible for a waifu.

### Trading & Duplicates

Duplicate waifus can be obtained, each with their own unique stats. Up to 5 duplicates are permitted per waifu per user (this is a soft limit; since this is not enforced by the database, more waifus can be generated in by an admin).
Waifus can be traded with other users using the `/trade` command. Once the first user submits a waifu for trading, the second user is able to accept and put up their own waifu for trade. If both users agree, the waifus are traded.

Note: due to Discord limitations, only 25 items can be in a dropdown menu at once. This means that if a user has more than 25 waifus, they will only be able to trade the 25 waifus with the highest ATK stat.

### Dogfighting

Dogfighting is a 3 round duel between users (both users must have at least 3 aircraft waifus for the dogfight to begin). Once a dogfight request is accepted, users can select their first aircraft waifu (and equip her with a weapon waifu if the user has any) and the round begins. The round works like this:

-   the waifu with the faster SPD stat attacks first
-   the waifu deals damage equal to her ATK stat (this is the combined stat of both the aircraft and weapon waifu)
-   the opposing waifu then deals damage equal to her ATK stat
-   the waifu first to reach 0 HP loses the round

This continues for 3 times, and the user with the most rounds won wins the dogfight. If both users win 2 rounds, the dogfight is a draw.

Note: due to Discord limitations, only 25 items can be in a dropdown menu at once. This means that if a user has more than 25 waifus, they will only be able to fight with the 25 waifus with the highest ATK stat.

## Changelog

See pull requests [here](https://github.com/KingWaffleIII/plane/pulls?q=is%3Apr+is%3Aclosed).

## Versioning

-   vX.Y.Z
    -   X: Major version (rarely used)
    -   Y: Minor version (new features [and maybe bug fixes])
    -   Z: Patch version (bug fixes)

## Roadmap

https://github.com/KingWaffleIII/plane/issues

## Licence

This project is licensed under the GNU General Public Licence 3.0 - see the [LICENCE](LICENCE) file for details
