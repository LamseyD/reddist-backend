import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/core"
import path from 'path'
import { User } from "./entities/User";

export default {
    migrations: {
        path: path.join(__dirname,'./migrations'), // path to the folder with migrations
        pattern: /^[\w-]+\d+\.[tj]s$/, // regex pattern for the migration files
    },
    dbName: 'reddis',
    user: 'root',
    host: 'localhost',
    password: 'password',
    port: 3306,
    type: 'mysql',
    //when not in production -> debugging is on -> log output
    debug: __prod__,
    entities: [Post, User] //set up migration, entities to keep track
} as Parameters<typeof MikroORM.init>[0]; 
//type gets more specific to be a const. You want the types to be exact
//export it as the exact type of MikroOrm. Using this lets you plug this in index.ts file
//Parameters returns an array -> use [0] first index
//By doing this, we export the entire object as Parameters of type of MikroOrm.init function
