import path from "path";
import TelegramBot from "node-telegram-bot-api";
import { LocalStorage } from "node-localstorage";

const DEFAULT_STORAGE_DIR = './tele-bot-storage';

export interface TeleBotOptions {
  token: string;
  secret: string;
  storageDir?: string;
}

interface GlobalContext {
  secret?: string,
  waitingSecret: boolean,
  idOwnerChat?: string,
  bot: TelegramBot,
  commands: { [key: string]: TelegramBot.BotCommand }
}

let localStorage = new LocalStorage( DEFAULT_STORAGE_DIR );

const global: GlobalContext = {
  commands: {},
  waitingSecret: false,
  bot: new TelegramBot( '', { polling: false, webHook: false }),
};

function validSecret( secret: string ) {
  return global.secret && ( global.secret === secret );
}

function botMessageHandler( msg: TelegramBot.Message ) {
  
  if ( global.waitingSecret ) {

    const idOwnerChat = msg.chat.id;

    if ( validSecret( msg.text || '' ) ) {
      setOwnerChatId( idOwnerChat );
      sendOwnerMessage( `Owner OK @ ${ idOwnerChat }` );
    } else {
      global.bot.sendMessage( idOwnerChat, `Owner ERR` );
    }

    global.waitingSecret = false;

    // delete secret from chat history
    global.bot.deleteMessage( idOwnerChat, msg.message_id );
  }

  if ( msg.text === '/owner' ) {
    if ( global.idOwnerChat ){
      sendOwnerMessage( `This bot already has an owner` )
    } else {
      global.waitingSecret = true;
      global.bot.sendMessage( msg.chat.id, `Please send me your secret` );
    }
  }

}

function applyCurrentCommands() {
  return global.bot.setMyCommands(
    Object.keys( global.commands )
      .map( cmdKey => global.commands[ cmdKey ] ) );
}

export function unsetCommands( commandKeys: string[] ) {
  commandKeys.forEach( key => {
    delete global.commands[ key ];
  })
  return applyCurrentCommands();
}

export function setCommands( commands:TelegramBot.BotCommand[] ) {
  commands.forEach( cmd => {
    global.commands[ cmd.command ] = cmd;
  })
  return applyCurrentCommands();
}

export function setup( options: TeleBotOptions ) {

  if ( options.storageDir ) {
    localStorage = new LocalStorage( options.storageDir );
  }

  const idOwnerChat = localStorage.getItem('id')

  if ( idOwnerChat ) {
    global.idOwnerChat = idOwnerChat
  }

  global.secret = options.secret;
  global.bot.removeAllListeners();

  global.bot = new TelegramBot( options.token, { 
    polling: true,
  });
  
  global.bot.on( 'message', botMessageHandler );
  
  setCommands([
    { command: 'owner', description: 'Set bot owner using self assignment' },
  ]).catch( err => {
    console.error( err );
  });

  return global.bot;
}

export function getOwnerChatId( callback:( idChat: string ) => void ) {
  if ( global.idOwnerChat ) {
    callback.apply( global.bot, [ global.idOwnerChat ] );
  }
}

export const validateEvent = ( 
  callback: ( message: TelegramBot.Message, metadata: TelegramBot.Metadata ) => void
) => {
  return ( message: TelegramBot.Message, metadata: TelegramBot.Metadata ) => {
    if ( message.chat.id.toString() === global.idOwnerChat! ) {
      callback( message, metadata );
    }
  }
}

export function sendOwnerMessage(
  msg: string, options?: TelegramBot.SendMessageOptions 
) {
  if ( global.idOwnerChat ) {
    return global.bot.sendMessage( global.idOwnerChat, msg, options );
  }
  return Promise.reject( new Error( 'Owner not configured' ) );
}

function setOwnerChatId( idChat: number ) {
  global.idOwnerChat = idChat.toString();
  localStorage.setItem( 'id', global.idOwnerChat );
}