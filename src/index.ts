import { LocalStorage } from "node-localstorage";
import { DEFAULT_STORAGE_DIR } from "./constants";
import { message } from 'telegraf/filters';
import { Telegraf, Scenes, Markup, session, Composer, Telegram, Context } from "telegraf";
import * as tg from "telegraf/typings/core/types/typegram";

interface GlobalContext {
  secret?: string;
  waitingSecret: boolean;
  idOwnerChat?: number;
  storage: LocalStorage; 
  commands: { [key: string]: tg.BotCommand };
}

const global: GlobalContext = {
  commands: {},
  waitingSecret: false,
  storage: new LocalStorage( DEFAULT_STORAGE_DIR )
}

function validSecret( secret: string ) {
  return global.secret && ( global.secret === secret );
}

const ownerScene = new Scenes.BaseScene<Scenes.SceneContext>('owner');

ownerScene.enter(async ctx => {
  await ctx.sendMessage(`Please, provide your authentication secret`);
});

ownerScene.on(message('text'), async (ctx) => {

  await ctx.deleteMessage();

  if ( validSecret( ctx.text ) ) {
    setOwnerChatId( ctx.message.chat.id );
    await ctx.reply(`Owner chat saved @ \`${ ctx.message.chat.id }\``, {
      parse_mode: 'Markdown'
    });
  } else {
    await ctx.reply('Given secret is not valid, please try again');
  }

  await ctx.scene.leave();
})

const authStage = new Scenes.Stage<Scenes.SceneContext>([
  ownerScene, 
], {
  ttl: 1*30,
});

export function middleware(
  secret: string,
  storageDir?: string,
) {

  global.secret = secret;

  if ( storageDir ) {
    global.storage = new LocalStorage( storageDir );
  }
  
  const idOwnerChat = global.storage.getItem('id')

  if ( idOwnerChat ) {
    global.idOwnerChat = Number(idOwnerChat)
  }

  return [
    authStage.middleware(),
    async (ctx: Scenes.SceneContext, next: () => Promise<void>) => {
      
      if (global.idOwnerChat === undefined) {
        return ctx.scene.enter('owner');
      } else {
        if (ctx.message) {
          if (ctx.message.chat.id === global.idOwnerChat) {
            return next();
          } else {
            ctx.sendMessage(`You are not allowed to use this bot`);
          } 
        } else {
          // This update implies a previous authentication
          return next();
        }

      } 
  
    },
  ];

}

export function getOwnerChatId() {
  return new Promise<number>((resolve, reject) => {
    if (global.idOwnerChat) {
      resolve(global.idOwnerChat);
    } else {
      reject(new Error( 'Bot does not have an owner' ));
    }
  })
}

function setOwnerChatId( idChat: number ) {
  global.idOwnerChat = idChat;
  global.storage.setItem('id', idChat.toString());
}