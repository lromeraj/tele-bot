"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnerChatId = exports.middleware = void 0;
const node_localstorage_1 = require("node-localstorage");
const constants_1 = require("./constants");
const filters_1 = require("telegraf/filters");
const telegraf_1 = require("telegraf");
const global = {
    commands: {},
    waitingSecret: false,
    storage: new node_localstorage_1.LocalStorage(constants_1.DEFAULT_STORAGE_DIR)
};
function validSecret(secret) {
    return global.secret && (global.secret === secret);
}
const ownerScene = new telegraf_1.Scenes.BaseScene('owner');
ownerScene.enter((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.sendMessage(`Please, provide your authentication secret`);
}));
ownerScene.on((0, filters_1.message)('text'), (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.deleteMessage();
    if (validSecret(ctx.text)) {
        setOwnerChatId(ctx.message.chat.id);
    }
    else {
        ctx.reply('Invalid secret, operation cancelled');
    }
    yield ctx.scene.leave();
}));
const authStage = new telegraf_1.Scenes.Stage([
    ownerScene,
], {
    ttl: 1 * 30,
});
function middleware(secret, storageDir) {
    return __awaiter(this, void 0, void 0, function* () {
        global.secret = secret;
        if (storageDir) {
            global.storage = new node_localstorage_1.LocalStorage(storageDir);
        }
        const idOwnerChat = global.storage.getItem('id');
        if (idOwnerChat) {
            global.idOwnerChat = idOwnerChat;
        }
        return [
            (ctx, next) => __awaiter(this, void 0, void 0, function* () {
                if (idOwnerChat === undefined) {
                    return ctx.scene.enter('owner');
                }
                else {
                    if (ctx.message && ctx.message.chat.id === Number(idOwnerChat)) {
                        return next();
                    }
                }
            }),
            authStage.middleware()
        ];
    });
}
exports.middleware = middleware;
function getOwnerChatId() {
    return new Promise((resolve, reject) => {
        if (global.idOwnerChat) {
            resolve(global.idOwnerChat);
        }
        else {
            reject(new Error('Bot does not have an owner'));
        }
    });
}
exports.getOwnerChatId = getOwnerChatId;
function setOwnerChatId(idChat) {
    global.idOwnerChat = idChat.toString();
    global.storage.setItem('id', global.idOwnerChat);
}
