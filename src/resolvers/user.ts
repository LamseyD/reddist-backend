import { User } from "../entities/User";
import { MyContext } from "../types";
import { Resolver, Mutation, InputType, Field, Arg, Ctx, ObjectType, Query } from "type-graphql";
import argon2 from "argon2";
import { COOKIE_NAME } from "../constants";
// import {EntityManager} from "@mikro-orm/mysql";

@InputType()
class UsernamePasswordInput{
    @Field()
    username!: string;
    @Field() //put arguments in here to overwrite types below
    password!: string; // \! is a definite assertion assignment -> tells typescript that it is indeed correct
}

@ObjectType()
class FieldError{
    @Field()
    field!: string;

    @Field()
    message!: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], {nullable: true}) //specify type specifically because they're nullable
    errors?: FieldError[]

    @Field(() => User, {nullable: true})
    user?: User
}

@Resolver()
export class UserResolver{
    @Query(() => User, {nullable: true})
    async me(
        @Ctx() { req, em }: MyContext
    ): Promise<User | null> {
        // @ts-ignore: type for userId missing here
        if (!req.session?.userId)
            return null;

        // @ts-ignore: type for userId missing here
        const user = await em.findOne(User, {id: req.session.userId});
        return user;
    }
    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput, //one way to do it or mention it specifically like in post
        @Ctx() {em, req}: MyContext
        //or @Arg('options', () => UsernamePasswordInput)
    ): Promise<UserResponse>{
        if (options.username.length <= 2){
            return { errors: [{
                field: "username",
                message: "length must be greater than 2"
            }]}
        }

        if (options.password.length <= 3){
            return { errors: [{
                field: "password",
                message: "length must be greater than 3"
            }]}
        }
        const hashedPassword = await argon2.hash(options.password);
        const user = em.create(User, {
            username: options.username, 
            password: hashedPassword});
        // let user;
        try {
            // entity builder using Knex
            // const result = await (em as EntityManager).createQueryBuilder(User).getKnexQuery().insert(
            //     {
            //         username: options.username,
            //         password: hashedPassword,
            //         created_at: new Date(),
            //         updated_at: new Date()
            //     }
            // ).returning("*");
            // user = result[0];
            await em.persistAndFlush(user);
        } catch (err){
            if (err.sqlState === "23000")
                return {
                    errors: [{
                        field: "username",
                        message: "username already exists",
                    }
                    ]
                }
            console.log("error: ", err.message);
        }

        req.session.userId = user.id; //storing user id in session
        return {
            user
        };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('options') options: UsernamePasswordInput, //one way to do it or mention it specifically like in post
        @Ctx() { em, req }: MyContext
        //or @Arg('options', () => UsernamePasswordInput)
    ): Promise<UserResponse> {
        const user = await em.findOneOrFail(User, {username: options.username});
        if (!user) {
            return { 
                errors: [{
                    field: "username",
                    message: 'that username doesnt exist'
                }]
            }
        }

        const valid = await argon2.verify( user.password ,options.password);
        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "incorrect password",
                    }
                ]
            }
        }
        req.session.userId = user.id; //storing user id in session
        return {
            user
        };
    }

    @Mutation (() => Boolean)
    logout(
        @Ctx() {req, res}: MyContext
    ) {
        return new Promise((resolve) => req.session.destroy(err => {
            if(err){
                console.log(err)
                resolve(false);
                return;
            }
            res.clearCookie(COOKIE_NAME);
            resolve(true);
        }));
    }
}