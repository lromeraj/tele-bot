import TelegramBot from "node-telegram-bot-api";
import { LocalStorage } from "node-localstorage";

const DEFAULT_STORAGE_DIR = './tele-bot-storage';

export {
  TelegramBot
}

export interface TeleBotOptions {
  token?: string;
  secret?: string;
  storageDir?: string;
  options?: TelegramBot.ConstructorOptions;
}

interface GlobalContext {
  secret?: string,
  waitingSecret: boolean,
  idOwnerChat?: string,
  bot?: TelegramBot,
  commands: { [key: string]: TelegramBot.BotCommand },
  storage: LocalStorage,
}

const global: GlobalContext = {
  commands: {},
  waitingSecret: false,
  storage: new LocalStorage( DEFAULT_STORAGE_DIR ),
}

function validSecret( secret: string ) {
  return global.secret && ( global.secret === secret );
}

function botMessageHandler( bot: TelegramBot, msg: TelegramBot.Message ) {
  
  if ( global.waitingSecret ) {

    const idOwnerChat = msg.chat.id;

    if ( validSecret( msg.text || '' ) ) {
      setOwnerChatId( idOwnerChat );
      sendOwnerMessage( `Owner OK @ ${ idOwnerChat }` );
    } else {
      bot.sendMessage( idOwnerChat, `Owner ERR` );
    }

    global.waitingSecret = false;

    // delete secret from chat history
    bot.deleteMessage( idOwnerChat, msg.message_id );
  }

  if ( msg.text === '/owner' ) {
    if ( global.idOwnerChat ){
      sendOwnerMessage( `This bot already has an owner` )
    } else {
      global.waitingSecret = true;
      bot.sendMessage( msg.chat.id, `Please send me your secret` )
    }
  }

}

function applyCurrentCommands( bot: TelegramBot ) {
  return bot.setMyCommands(
    Object.keys( global.commands )
      .map( cmdKey => global.commands[ cmdKey ] ) );
}

export function unsetCommands( bot: TelegramBot, commandKeys: string[] ) {
  commandKeys.forEach( key => {
    delete global.commands[ key ];
  })
  return applyCurrentCommands( bot );
}

export function setCommands( bot: TelegramBot, commands:TelegramBot.BotCommand[] ) {
  commands.forEach( cmd => {
    global.commands[ cmd.command ] = cmd;
  })
  return applyCurrentCommands( bot );
}

export function setup( 
  options: TeleBotOptions, 
  _errHandler?: ( err: Error ) => void 
) {

  if ( options.storageDir ) {
    global.storage = new LocalStorage( options.storageDir );
  }

  const idOwnerChat = global.storage.getItem('id')

  if ( idOwnerChat ) {
    global.idOwnerChat = idOwnerChat
  }
  
  if ( options.secret && options.token ) {
    
    global.secret = options.secret;

    global.bot = new TelegramBot( options.token, {
      polling: true,
    });
    
    global.bot.on( 'message', 
      botMessageHandler.bind( null, global.bot ) );
    
    const defaultErrHandler = 
      ( err: Error ) => console.error( err )  

    const errHandler: ( err: Error ) => void = 
      _errHandler || defaultErrHandler

    global.bot.on( 'error', errHandler );

    setCommands( global.bot, [
      { 
        command: 'owner', 
        description: 'Set bot owner using self assignment' 
      },
    ]).catch( errHandler );

  }

}

export function getOwnerChatId( 
  callback:( bot: TelegramBot, idChat: string ) => void 
) {
  if ( global.bot && global.idOwnerChat ) {
    callback.apply( global.bot, [ global.bot, global.idOwnerChat ] );
  }
}

export const validateEvent = ( 
  callback: ( message: TelegramBot.Message, metadata: TelegramBot.Metadata ) => void
) => {
  return ( message: TelegramBot.Message, metadata: TelegramBot.Metadata ) => {
    if ( message.chat.id.toString() === global.idOwnerChat ) {
      callback( message, metadata );
    }
  }
}

function sendOwnerMessage(
  msg: string, options?: TelegramBot.SendMessageOptions 
) {
  if ( global.bot && global.idOwnerChat ) {
    global.bot.sendMessage( global.idOwnerChat, msg, options );
  }
}

function setOwnerChatId( idChat: number ) {
  global.idOwnerChat = idChat.toString();
  global.storage.setItem( 'id', global.idOwnerChat );
}