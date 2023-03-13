import TelegramBot  from "node-telegram-bot-api";
import { LocalStorage } from "node-localstorage";

const localStorage = new LocalStorage( './tele-bot/' );

let idOwnerChat = localStorage.getItem( 'id' );
let bot:  TelegramBot = new TelegramBot( '', { polling: false, webHook: false });

function botMessageHandler( msg: TelegramBot.Message ) {
  
  const splittedMessage = msg.text?.split(/\s+/) || [ 'help' ];
  const cmd = splittedMessage[0];
  const argv = splittedMessage.slice(1);
  const argc = argv.length

  if ( !idOwnerChat && cmd === '/owner' ) {

    if ( argc === 1 && argv[ 0 ] === process.env.BOT_SECRET! ) {
      setOwnerId( msg.chat.id );
      bot.sendMessage( msg.chat.id, `Owner OK @ ${ idOwnerChat }` );
    } else {
      bot.sendMessage( msg.chat.id, `Owner ERR` );
    }

  }
}

export const setup = ( token: string ) => {

  bot.removeAllListeners();

  bot = new TelegramBot( token, { 
    polling: true,
  });

  bot.on( 'message', botMessageHandler );

  return bot;
}

export function sendOwnerMessage( 
  msg: string, options?: TelegramBot.SendMessageOptions 
) {
  if ( idOwnerChat ) {
    return bot.sendMessage( idOwnerChat, msg, options );
  }
  return Promise.reject( new Error('Owner not setted up') )
}

function setOwnerId( idChat: number ) {
  idOwnerChat = idChat.toString();
  localStorage.setItem( 'id', idOwnerChat );
}

