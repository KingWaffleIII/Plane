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

Note: due to clashes with my custom bot, `bot/entrypoint.sh` is not provided but you can use this template:

```sh
#!/bin/bash
npm i
npm run start
```

## Waifus

Waifus are a complex, main [gacha](https://en.wikipedia.org/wiki/Gacha_game) feature of the bot.
There are two types of waifus: **aircraft** and **weapon**, with 44 in total.

### Aircraft waifus

Aircraft waifus are the main type of waifu. They have an **ATK** (1-10), **HP** (50-100), and **SPD** (1-10) stat, which are randomly generated and used for [dogfighting](#Dogfighting). There is no bias for the stats - fighters can have high DEF stats but low ATK/SPD and utility aircraft can have high ATK/SPD but low DEF.

### Weapon waifus

Weapon waifus are the secondary type of waifu. They have just a randomly generated **ATK** (1-10) stat which is intended to be used in conjunction with aircraft waifus in [dogfighting](#Dogfighting), as well as a special ability.

### Weapon abilities

**Adder: ???** - ???

**AMRAAM: Precision Strike** - After equipping this weapon, your next attack will be guaranteed to crit.

**HARM: Lock-on** - After equipping this weapon, the next time the opponent attempts to evade, your attack is guaranteed to hit.

**Hellfire: Fire and Forget** - After equipping this weapon, this missile will deal 1/2 of the aircraft's and this weapon's combined ATK to the opponent every round, on top of any attacks the aircraft may have made.

**Paveway II: Heavy Payload** - After equipping this weapon, your next attack will deal 3x damage but you can no longer evade attacks.

**Phoenix:** ??? - ???

**Sidewinder: Stunwave** - After equipping this weapon, your next attack will stun your opponent, meaning they cannot do anything that round.

**Sparrow: ???** - ???

**Trident II: Call for Support** - After equipping this weapon, your next attack will call in a support strike, dealing damage equivalent to this weapon's ATK to the opponent, on top of any attacks this round.

### Obtaining waifus

Waifus can be obtained in two ways depending on her type:

-   through `/airrec` (**spec** aircraft waifus)
-   winning airrec quizzes (**non-spec** aircraft waifus and weapon waifus)

With `/airrec`, there is a **~21% chance** of getting an **eligible** aircraft, and a further **33% chance** of a waifu spawning from that eligible aircraft. This means that there is a **~7% chance** of getting a waifu from `/airrec`.
With airrec quizzes, there is a **~33% chance** of getting a waifu **when you win a quiz**. To stop people spamming quizzes with just themselves, the quiz must have at least **5 rounds** and the winner needs to have gained at least **1/4 of the total points** (e.g. if there are 10 rounds, there are 20 points available and 2.5 are needed) to be eligible for a waifu.

### Guaranteeing waifus

RNGesus can be a bitch, so you can target a waifu to unlock. Once you do that, you will be guaranteed to get that waifu after 10 other waifus obtained from the above two methods. If you get your targeted waifu earlier, rejoice!

### Trading & Duplicates

Duplicate waifus can be obtained, each with their own unique stats. Up to 5 duplicates are permitted per waifu per user (this is a soft limit; since this is not enforced by the database, more waifus can be generated in by an admin).
Waifus can be traded with other users. Once the first user submits a type of waifu for trading and then a dupe of that waifu, the second user is able to accept and put up their own waifu dupe for trade. If both users agree, the waifus are traded.

Note: due to Discord limitations, only 25 items can be in a dropdown menu at once. This means that if a user has more than 25 waifus, they will only be able to trade the 25 waifus with the highest ATK stat.

### Dogfighting

Dogfighting is a duel between users. Once a dogfight request is accepted, users can select an aircraft waifu and begin the dogfight. The dogfight works like this:

-   the waifu with the faster SPD stat goes first
-   they can either attack, evade or equip a weapon
-   equipping a weapon is done by selecting a weapon waifu, which then adds its ATK stat to the aircraft waifu's ATK stat
-   if an aircraft attempts to evade, depending on the aircraft's SPD (calculation TBD), the evade can fail or succeed. If it succeeds, the aircraft cannot be damaged that round (except HARM). If it fails, the aircraft will be stunned that round. This encourages META as some weapons are only useful against aircraft with high SPD
-   when attacking, the waifu deals damage equal to her ATK stat (this is the combined stat of both the aircraft and weapon waifu) with a 10% chance of dealing double damage (crit)
-   the opposing waifu then has their go
-   the waifu first to reach 0 HP loses

Weapon waifus also have unique abilities to help win the dogfight.

Note: due to Discord limitations, only 25 items can be in a dropdown menu at once. This means that if a user has more than 25 waifus, they will only be able to fight with the 25 waifus (copies) with the highest ATK stat.

### Dogfighting META

WIP

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

```

```
