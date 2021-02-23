import "reflect-metadata";
//to compile ts files in node -> use ts-node
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import microConfig from "./mikro-orm.config";

import express from 'express'
import { ApolloServer } from 'apollo-server-express'; //for GraphQL endpoints
import { buildSchema } from "type-graphql"; //create graphql schema
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

const main = async () => {
    //handle database transactions
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up(); //runs when server restarts, don't rerun old migrations

    const app = express();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers:[UserResolver, HelloResolver, PostResolver],
            validate: false
        }),
        context: () => ({ em: orm.em })
    })

    apolloServer.applyMiddleware({ app })

    app.listen(4000, () => {
        console.log('App is listening on port 4000.');
    })
}

main().catch((error) => {
    console.error(error);
});
//returns a promise
