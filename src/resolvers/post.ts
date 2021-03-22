import { isAuth } from "../middleware/isAuth";
import { MyContext } from "src/types";
import { Resolver, Query, Arg, Mutation, InputType, Field, Ctx, UseMiddleware, Int, FieldResolver, Root, ObjectType } from "type-graphql";
import { Post } from '../entities/Post';
import { getConnection } from "typeorm";

@InputType()
class PostInput{
    @Field()
    title!: string;

    @Field()
    text!: string;
}

@ObjectType()
class PaginatedPosts{
    @Field(() => [Post])
    posts!: Post[]

    @Field()
    hasMore!: boolean
}

//simple CRUD
@Resolver(Post)
export class PostResolver{
    //returns a string. Field we create and send to client. 
    //This gets called when there's a Post object
    @FieldResolver(() => String) 
    textSnippet(
        @Root() root: Post 
    ): string{
        return root.text.slice(0, 50) + "...";
    }

    @Query(() => PaginatedPosts) //setting graphQL type
    async posts(
        // @Ctx(){ em }: MyContext
        @Arg('limit', () => Int) limit: number, //type number is default to be float in GraphQL
        // @Arg('offset') offset: number //! Offset Pagination
        @Arg('cursor', () => String, {nullable: true}) cursor: string | null
    ): Promise<PaginatedPosts>{ //setting TypeScript type here
        const maxPosts = Math.min(50, limit) + 1;
        const qb = getConnection()
        .getRepository(Post)
        .createQueryBuilder("p")
        .orderBy("createdAt", "DESC")
        .take(maxPosts)
        
        if (cursor)
            qb.where("createdAt < :cursor", {cursor: new Date(parseInt(cursor))})

        const posts = await qb.getMany();
        console.log(posts.length)
        return {posts: posts.slice(0, maxPosts - 1), hasMore: posts.length === maxPosts};
        // return em.find(Post, {});
        // return Post.find();
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
    @UseMiddleware(isAuth) //specify middleware here
    async createPost(
        @Arg("options") options: PostInput,
        @Ctx() { req } : MyContext
    ): Promise<Post> {

        // 2 sql queries
        const post = Post.create({ ...options, creatorId: req.session.userId }).save();
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
