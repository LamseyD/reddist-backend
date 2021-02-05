//to compile ts files in node -> use ts-node
import { MikroORM } from "@mikro-orm/core"
import { __prod__ } from "./constants";
// import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config"
const main = async () => {
    //handle database transactions
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();
    // const post = orm.em.create(Post, {title: 'my first post'});
    // await orm.em.persistAndFlush(post); // roughly equivalent to await orm.em.nativeInsert(Post, {title:'my first post'})
    // const posts = await orm.em.find(Post, {})
    // console.log(posts)
}

main().catch((error) => {
    console.error(error);
});
//returns a promise
