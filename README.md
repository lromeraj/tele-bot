# Generic Telegram bot

This is a generic bot for *Telegram* which allows you to be the owner so you can communicate privately with the bot. If you are not familiar with Telegram bots, you can simply follow the below instructions.

# How to create Telegram a bot

1. First you need a Telegram account, if you don't have it, please create a new one.
2. Start a chat with the [BotFather](https://t.me/botfather).
3. Send the command `/newbot` to create a new one. The _BotFather_ will guide you during the whole process.
    > **NOTE**: you will have to give two names, the first one is used as a displayable name for the bot, and the second one is to set a unique name identifier four your bot, I recommend you to use the following template for the unique name: `<YOUR_USER_NAME>_<BOT_NAME>_bot`.
4. Copy the token from your bot and paste it in your own instance's configuration.
5. Run your instance and follow the [following instructions](#how-to-communicate-privately-with-your-bot) to set you as the owner of the bot.

> **NOTE**: send `/help` command to _BotFather_ in order to see all available options to customize more your bot.

# How to communicate privately with your bot
When your new bot has been created and it's ready to receive messages, in order to communicate privately with it you have to tell the bot that only you will be able to communicate with him, to achieve that, simply send to your bot the following command:

``` txt
/owner
```

The bot will request you a secret which you have previously configured in your instance. The bot will remove the secret from the chat history and will send a final message like:

``` txt
OK @ <CHAT_ID>
```
This identifier is stored in the local storage of your instance and used to identify the owner's chat.