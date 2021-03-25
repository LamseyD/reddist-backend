"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const Post_1 = require("./entities/Post");
const Upvote_1 = require("./entities/Upvote");
const User_1 = require("./entities/User");
exports.default = {
    migrations: [
        path_1.default.join(__dirname, './migrations'),
    ],
    type: 'mysql',
    database: 'lireddit',
    username: 'root',
    host: 'localhost',
    password: 'password',
    logging: true,
    synchronize: true,
    entities: [Post_1.Post, User_1.User, Upvote_1.Upvote]
};
//# sourceMappingURL=typeorm.config.js.map