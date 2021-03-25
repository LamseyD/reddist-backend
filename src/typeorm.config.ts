import path from "path";
import { createConnection } from "typeorm";
import { Post } from "./entities/Post";
import { Upvote } from "./entities/Upvote";
import { User } from "./entities/User";

export default {
    migrations: [
        path.join(__dirname,'./migrations'), // path to the folder with migrations
    ],
    type: 'mysql',
    database: 'lireddit',
    username: 'root',
    host: 'localhost',
    password: 'password',
    logging: true,
    synchronize: true, //create table for you without making migrations
    entities: [Post, User, Upvote]
} as Parameters<typeof createConnection>[0];