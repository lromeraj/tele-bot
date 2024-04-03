import os from "os";
import path from "path";

export const DEFAULT_STORAGE_DIR = 
  path.join( os.tmpdir(), `tele-bot-${ process.pid }` );