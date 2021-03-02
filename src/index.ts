import "reflect-metadata";
//to compile ts files in node -> use ts-node
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import microConfig from "./mikro-orm.config";

import express from 'express';
import redis from 'redis';
// import Redis from "ioredis";
import session from 'express-session';
import connectRedis from 'connect-redis';
import { ApolloServer } from 'apollo-server-express'; //for GraphQL endpoints
import { buildSchema } from "type-graphql"; //create graphql schema
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import cors from 'cors'

const main = async () => {
    //handle database transactions
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up(); //runs when server restarts, don't rerun old migrations

    const app = express();

    app.use(cors({
        origin: "http://localhost:3000",
        credentials: true
    }))
    
    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient({host: "127.0.0.1", port: 6379});

    //run session middleware before apollo middleware because you want sessions inside apollo
    app.use(
        session({
            name: 'qid', //cookie name
            //when storing data in redis, ttl means how long data last in redis. if user does an action, ping 
            //redis and extend the data ttl. if disable touch/ttl makes redis data live forever, however this shouldn't be in production
            store: new RedisStore({ client: redisClient, disableTouch: true}), //tell express we're using redis
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //cookie last for 10 years?
                httpOnly: true, //security reason, can't access the cookie on front end
                sameSite: 'lax', //protecting against csrf
                secure: !__prod__//cookie only works in https (production)
            },
            saveUninitialized: false,
            secret: 'keyboard cat', //cookie secret
            resave: false,
        })
    );

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers:[UserResolver, HelloResolver, PostResolver],
            validate: false
        }),
        context: ({req, res}) => {
            return ({ em: orm.em, req, res });
        } //access req, res context in apollo server with express
    })

    apolloServer.applyMiddleware({ app, cors: false })

    app.listen(4000, () => {
        console.log('App is listening on port 4000.');
    })
}

main().catch((error) => {
    console.error(`error: ${error}`);
});
//returns a promise
