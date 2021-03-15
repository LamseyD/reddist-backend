import { Resolver, Query, Arg, Mutation } from "type-graphql";
import { Post } from '../entities/Post';

//simple CRUD
@Resolver()
export class PostResolver{
    @Query(() => [Post]) //setting graphQL type
    posts(
        // @Ctx(){ em }: MyContext
    ): Promise<Post[]>{ //setting TypeScript type here
        // return em.find(Post, {});
        return Post.find();
    }

    @Query(() => Post, {nullable: true}) //setting graphQL type
    post(
        @Arg('id') id: number, //input/ contexts - id is just something we want to use for our code. In actual query use the string in bracket
        // @Ctx(){ em }: MyContext
    ): Promise<Post | undefined>{ //setting return TypeScript type here
        // return em.findOne(Post, {id});
        return Post.findOne(id);
    }

    @Mutation(() => Post)
    async createPost(
        @Arg("title") title: string,
        // @Ctx() {} : MyContext
    ): Promise<Post> {
        // 2 sql queries
        const post = Post.create({ title }).save();
        return post;
    }

    @Mutation(() => Post, {nullable: true})
    async updatePost(
        @Arg("id") id: number,
        @Arg("title", () => String, {nullable: true}) title: string, //must explicitly set the type if set something to nullible
        // @Ctx() { em } : MyContext
    ): Promise<Post | null> {
        // const post = await em.findOne(Post, { id });
        const post = await Post.findOne(id);
        if (!post) {
            return null;
        }
        if (typeof title !== 'undefined'){
            post.title = title;
            // await em.persistAndFlush(post);
            Post.update({id}, {title});
        }
        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(
        @Arg("id") id: number,
        // @Ctx() { em } : MyContext
    ): Promise<boolean> {
        // await em.nativeDelete(Post, { id });
        await Post.delete(id);
        return true;
    }
}
