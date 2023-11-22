import TelegramBot from "node-telegram-bot-api";
export { TelegramBot };
export interface TeleBotOptions {
    token?: string;
    secret?: string;
    storageDir?: string;
    opts?: TelegramBot.ConstructorOptions;
}
export declare function getBot(): Promise<TelegramBot>;
export declare function unsetCommands(commandKeys: string[]): Promise<boolean>;
export declare function setCommands(commands: TelegramBot.BotCommand[]): Promise<boolean>;
export declare function setup(options: TeleBotOptions, _errHandler?: (err: Error) => void): void;
export declare function getOwnerChatId(): Promise<[TelegramBot, string]>;
export declare const validateEvent: (callback: (message: TelegramBot.Message, metadata: TelegramBot.Metadata) => void) => (message: TelegramBot.Message, metadata: TelegramBot.Metadata) => void;
