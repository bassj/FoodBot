# Unofficial RIT Discord Bot
Hal is the bot that helps with managing the RIT discord server. It provides tools for the staff of the server to do moderation, and a few fun tools for the users.

Additionally, it includes some useful tools like a course browser, bus arrival time estimator, and something to see what places to eat are open on campus.

## How to run Hal
1. Pull the code down via `git clone https://github.com/Chris-Bitler/RIT-HAL.git`
2. Replace the `discord_token` and `rapidapi_token` in `.env.bk` with API tokens from the respective services.
3. Move `.env.bk` to `.env`
4. Run `npm install` in the project directory
5. Run the bot via `npm run run`