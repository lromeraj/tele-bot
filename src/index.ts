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
  idOwnerChat?: string,
  bot: TelegramBot,
  commands: { [key: string]: TelegramBot.BotCommand }
}

let localStorage = new LocalStorage( DEFAULT_STORAGE_DIR );

const global: GlobalContext = {
  commands: {},
  bot: new TelegramBot( '', { polling: false, webHook: false }),
};

function validSecret( secret: string ) {
  return global.secret && ( global.secret === secret );
}

function botMessageHandler( msg: TelegramBot.Message ) {
  
  const splittedMessage = msg.text?.split(/\s+/) || [ 'help' ];
  const cmd = splittedMessage[0];
  const argv = splittedMessage.slice(1);
  const argc = argv.length;

  if ( !global.idOwnerChat && cmd === '/owner' ) {
    
    const idOwnerChat = msg.chat.id;
    
    if ( argc === 1 && validSecret( argv[ 0 ] ) ) {
      setOwnerChatId( idOwnerChat );
      global.bot.sendMessage( idOwnerChat, `Owner OK @ ${ idOwnerChat }` );
    } else {
      global.bot.sendMessage( idOwnerChat, `Owner ERR` );
    }

    global.bot.deleteMessage( idOwnerChat, msg.message_id );
  
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

  return new Promise( (resolve, reject) => {
    
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
    ]).then( () => resolve( global.bot ) ).catch( reject );

  })

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