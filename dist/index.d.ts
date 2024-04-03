import { Scenes } from "telegraf";
import * as tg from "telegraf/typings/core/types/typegram";
export declare function middleware(secret: string, storageDir?: string): import("telegraf").MiddlewareFn<Scenes.SceneContext<Scenes.SceneSessionData>, tg.Update>[];
export declare function getOwnerChatId(): Promise<number>;
