"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_STORAGE_DIR = void 0;
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
exports.DEFAULT_STORAGE_DIR = path_1.default.join(os_1.default.tmpdir(), `tele-bot-${process.pid}`);
