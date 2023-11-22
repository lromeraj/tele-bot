"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEvent = exports.getOwnerChatId = exports.setup = exports.setCommands = exports.unsetCommands = exports.getBot = exports.TelegramBot = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
exports.TelegramBot = node_telegram_bot_api_1.default;
const node_localstorage_1 = require("node-localstorage");
const constants_1 = require("./constants");
const global = {
    commands: {},
    waitingSecret: false,
    storage: new node_localstorage_1.LocalStorage(constants_1.DEFAULT_STORAGE_DIR)
};
function validSecret(secret) {
    return global.secret && (global.secret === secret);
}
function botMessageHandler(bot, msg) {
    if (global.waitingSecret) {
        const idOwnerChat = msg.chat.id;
        if (validSecret(msg.text || '')) {
            setOwnerChatId(idOwnerChat);
            sendOwnerMessage(`Owner OK @ ${idOwnerChat}`);
        }
        else {
            bot.sendMessage(idOwnerChat, `Owner ERR`);
        }
        global.waitingSecret = false;
        // delete secret from chat history
        bot.deleteMessage(idOwnerChat, msg.message_id);
    }
    if (msg.text === '/owner') {
        if (global.idOwnerChat) {
            sendOwnerMessage(`This bot already has an owner`);
        }
        else {
            global.waitingSecret = true;
            bot.sendMessage(msg.chat.id, `Please send me your secret`);
        }
    }
}
function applyCurrentCommands() {
    if (global.bot) {
        return global.bot.setMyCommands(Object.keys(global.commands)
            .map(cmdKey => global.commands[cmdKey]));
    }
    else {
        return Promise.reject('Bot is not defined');
    }
}
function getBot() {
    return new Promise((resolve, reject) => {
        if (global.bot) {
            resolve(global.bot);
        }
        else {
            reject(new Error('Bot is not ready'));
        }
    });
}
exports.getBot = getBot;
function unsetCommands(commandKeys) {
    commandKeys.forEach(key => {
        delete global.commands[key];
    });
    return applyCurrentCommands();
}
exports.unsetCommands = unsetCommands;
function setCommands(commands) {
    commands.forEach(cmd => {
        global.commands[cmd.command] = cmd;
    });
    return applyCurrentCommands();
}
exports.setCommands = setCommands;
function setup(options, _errHandler) {
    if (options.storageDir) {
        global.storage = new node_localstorage_1.LocalStorage(options.storageDir);
    }
    const idOwnerChat = global.storage.getItem('id');
    if (idOwnerChat) {
        global.idOwnerChat = idOwnerChat;
    }
    if (options.secret && options.token) {
        global.secret = options.secret;
        global.bot = new node_telegram_bot_api_1.default(options.token, {
            polling: true,
        });
        global.bot.on('message', botMessageHandler.bind(null, global.bot));
        const defaultErrHandler = (err) => console.error(err);
        const errHandler = _errHandler || defaultErrHandler;
        global.bot.on('error', errHandler);
        global.bot.on('polling_error', errHandler);
        global.bot.on('webhook_error', errHandler);
        setCommands([
            {
                command: 'owner',
                description: 'Set bot owner using self assignment'
            },
        ]).catch(errHandler);
    }
}
exports.setup = setup;
function getOwnerChatId() {
    return new Promise((resolve, reject) => {
        if (global.bot && global.idOwnerChat) {
            resolve([global.bot, global.idOwnerChat]);
        }
        else {
            reject(new Error('Bot does not have an owner'));
        }
    });
}
exports.getOwnerChatId = getOwnerChatId;
const validateEvent = (callback) => {
    return (message, metadata) => {
        if (message.chat.id.toString() === global.idOwnerChat) {
            callback(message, metadata);
        }
    };
};
exports.validateEvent = validateEvent;
function sendOwnerMessage(msg, options) {
    if (global.bot && global.idOwnerChat) {
        global.bot.sendMessage(global.idOwnerChat, msg, options);
    }
}
function setOwnerChatId(idChat) {
    global.idOwnerChat = idChat.toString();
    global.storage.setItem('id', global.idOwnerChat);
}
