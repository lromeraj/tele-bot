import path from "path";

export const DEFAULT_STORAGE_DIR = 
  path.join( 'tmp', `tele-bot-${ process.pid }` );