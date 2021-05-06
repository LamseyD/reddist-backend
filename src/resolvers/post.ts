import { isAuth } from "../middleware/isAuth";
import { MyContext } from "src/types";
import { Resolver, Query, Arg, Mutation, InputType, Field, Ctx, UseMiddleware, Int, FieldResolver, Root, ObjectType } from "type-graphql";
import { Post } from '../entities/Post';
import { getConnection } from "typeorm";
import { Upvote } from "../entities/Upvote";

@InputType()
class PostInput {
    @Field()
    title!: string;

    @Field()
    text!: string;
}

@ObjectType()
class PaginatedPosts {
    @Field(() => [Post])
    posts!: Post[]

    @Field()
    hasMore!: boolean
}

//simple CRUD
@Resolver(Post)
export class PostResolver {
    //returns a string. Field we create and send to client. 
    //This gets called when there's a Post object
    @FieldResolver(() => String)
    textSnippet(
        @Root() root: Post
    ): string {
        return root.text.slice(0, 50) + "...";
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg('postId', () => Int) postId: number,
        @Arg('value', () => Int) value: number,
        @Ctx() { req }: MyContext
    ): Promise<boolean> {
        const isUpvote = value > 0;
        const realValue = isUpvote ? 1 : -1;
        const { userId } = req.session;

        //find out if post is already upvoted
        const upvote = await Upvote.findOne({ where: { postId, userId } });
        const post = await Post.findOne({ id: postId });

        //if already upvoted -> changing upvote
        if (upvote) {
            try {
                //* change vote
                if (upvote.value !== realValue) {
                    upvote.value = realValue;
                    await Upvote.save(upvote);
                    if (post) {
                        post.points = post.points + 2 * realValue;
                        await Post.save(post);
                    }
                    //* "unvote"
                } else {
                    await Upvote.delete({ userId, postId })
                    if (post) {
                        post.points = post.points - realValue;
                        await Post.save(post);
                    }
                }
            } catch (error) {
                console.log("error: Something went wrong while trying to change vote. \n", error.message)
                return false;
            }
        } else {
            //* upvoting for the first time
            try {
                await Upvote.insert({
                    userId,
                    postId,
                    value: realValue,
                })
                if (post) {
                    post.points = post.points + realValue;
                    await Post.save(post);
                }
            } catch (error) {
                console.log("error: Something went wrong while upvoting. \n", error)
                return false;
            }
        }
        return true;

        //---------------OR
        // await getConnection().query(
        //     `START TRANSACTION; insert into upvote("userId", "postId", value) values (${userId}, ${postId}, ${realValue}); update post set points = points + ${realValue} where id = ${postId}; COMMIT;`
        // );
        //---------------another way to make a transaction
        // await getConnection().transaction(async tm => {
        //     await tm.query(`
        //         insert into upvote("userId", "postId", value)
        //         values ($1, $2, $3)
        //     `, [userId, postId, realValue])    
        // 
        // await tm.query(`
        //      update post
        //      set points = points + $1
        //      where id = $2
        //`, [realValue, postId]);
        //})
    }

    @Query(() => PaginatedPosts) //setting graphQL type
    async posts(
        // @Ctx(){ em }: MyContext
        @Arg('limit', () => Int) limit: number, //type number is default to be float in GraphQL
        // @Arg('offset') offset: number //! Offset Pagination
        @Arg('cursor', () => String, { nullable: true }) cursor: string | null,
        @Ctx() { req }: MyContext
    ): Promise<PaginatedPosts> { //setting TypeScript type here
        const maxPosts = Math.min(50, limit) + 1;
        // const qb = getConnection()
        //     .getRepository(Post)
        //     .createQueryBuilder("p")
        //     .innerJoinAndSelect("p.creator", "user", "user.id = p.creatorId")
        //     //! Not doing anything right now. To be addressed in later version of TypeORM.
        //     .addSelect(subQuery => {
        //         return subQuery.select("upvote.value")
        //             .from(Upvote, "upvote")
        //             .where("upvote.userId = :userId and upvote.postId = p.id", { userId: req.session.userId })
        //     }, "voteStatus")
        //     .orderBy("p.createdAt", "DESC")
        //     .take(maxPosts)
        // if (cursor){
        //     qb.where("p.createdAt < :cursor", { cursor: new Date(parseInt(cursor)) })
        // }
        // const posts = await qb.getMany();
        // console.log("separator");
        
        // console.log(cursor);
        let posts = await getConnection().query(
        `   select 
                p.*,
                JSON_OBJECT(
                    'id', u.id,
                    'username', u.username,
                    'email', u.email,
                    'createdAt', u.createdAt,
                    'updatedAt', u.updatedAt
                ) AS creator,
                ${req.session.userId ? (`(select value from upvote where userId = ${req.session.userId} and postId = p.id) as voteStatus`) : ("null as voteStatus")}
            from post p
            inner join lireddit.user u on u.id = p.creatorId
            ${cursor ? `where p.createdAt < '${(new Date(parseInt(cursor) - 3600 * 1000 * 4)).toISOString()}'` : ""}
            order by p.createdAt DESC
            limit ${maxPosts}
        `);
        posts = posts.map((p: { creator: string; }) => {
            let parsedCreator = JSON.parse(p.creator);
            p.creator = parsedCreator;
            return p;
        })
        console.log(req.session.userId);
        if (cursor)
            console.log((new Date(parseInt(cursor))).toISOString())
        return { posts: posts.slice(0, maxPosts - 1), hasMore: posts.length === maxPosts };
    }

    @Query(() => Post, { nullable: true }) //setting graphQL type
    async post(
        @Arg('id', () => Int) id: number, //input/ contexts - id is just something we want to use for our code. In actual query use the string in bracket
        @Ctx(){ req }: MyContext
    ): Promise<Post | undefined> { //setting return TypeScript type here
        const post = await Post.findOne(id, {relations: ["creator"]});
        const upvote = await Upvote.findOne({ postId: id, userId: req.session.userId });
        if (upvote?.value === 1){
            post!.voteStatus = 1;
        } else if (upvote?.value === -1){
            post!.voteStatus = -1;
        }
        return post;
    }

    @Mutation(() => Post)
    @UseMiddleware(isAuth) //specify middleware here
    async createPost(
        @Arg("options") options: PostInput,
        @Ctx() { req }: MyContext
    ): Promise<Post> {

        // 2 sql queries
        const post = Post.create({ ...options, creatorId: req.session.userId }).save();
        return post;
    }

    @Mutation(() => Post, { nullable: true })
    @UseMiddleware(isAuth)
    async updatePost(
        @Arg("id", () => Int) id: number,
        @Arg("text", () => String, { nullable: true }) text: string, //must explicitly set the type if set something to nullible
        @Ctx() { req } : MyContext
    ): Promise<Post | null> {
        // const post = await em.findOne(Post, { id });
        const post = await Post.findOne(id, {relations: ["creator"]});
        if (!post) {
            return null;
        }
        if (typeof text !== 'undefined') {
            post.text = text;
            // await em.persistAndFlush(post);
            await Post.update({ id, creatorId: req.session.userId }, { text });
        }
        return post;
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deletePost(
        @Arg("id", () => Int) id: number,
        @Ctx() { req } : MyContext
    ): Promise<boolean> {
        // await em.nativeDelete(Post, { id });
        await Upvote.delete({postId: id})
        await Post.delete({id, creatorId: req.session.userId});
        return true;
    }
}
