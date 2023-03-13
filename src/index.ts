import TelegramBot from "node-telegram-bot-api";
import { LocalStorage } from "node-localstorage";

const localStorage = new LocalStorage( './tele-bot/' );

interface GlobalContext {
  secret?: string,
  idOwnerChat?: string,
  bot: TelegramBot,
}

const global: GlobalContext = {
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
    
  }

}

export function setup( token: string, secret: string ) {

  const idOwnerChat = localStorage.getItem('id')
  
  if ( idOwnerChat ) {
    global.idOwnerChat = idOwnerChat
  }

  global.secret = secret;
  global.bot.removeAllListeners();

  global.bot = new TelegramBot( token, { 
    polling: true,
  });

  global.bot.setMyCommands([
    { command: 'owner', description: 'Allows you to be assigned as a proprietary of the bot' },
  ]);
  
  global.bot.on( 'message', botMessageHandler );

  return global.bot;
}

export function sendOwnerMessage( 
  msg: string, options?: TelegramBot.SendMessageOptions 
) {
  if ( global.idOwnerChat ) {
    return global.bot.sendMessage( global.idOwnerChat, msg, options );
  }
  return Promise.reject( new Error('Owner not setted up') )
}

function setOwnerChatId( idChat: number ) {
  global.idOwnerChat = idChat.toString();
  localStorage.setItem( 'id', global.idOwnerChat );
}