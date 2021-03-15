import { createConnection } from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";

export default {
    type: 'mysql',
    database: 'lireddit',
    username: 'root',
    host: 'localhost',
    password: 'password',
    logging: true,
    synchronize: true, //create table for you without making migrations
    entities: [Post, User]
} as Parameters<typeof createConnection>[0];