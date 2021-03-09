import { User } from "../entities/User";
import { MyContext } from "../types";
import { Resolver, Mutation, Arg, Ctx, Query } from "type-graphql";
import argon2 from "argon2";
import { COOKIE_NAME } from "../constants";
import { UsernamePasswordInput } from "../entities/UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { UserResponse } from "../entities/UserResponse";
@Resolver()
export class UserResolver{
    @Mutation(() => Boolean)
    async forgotPassword(
        // @Arg("email") email: string,
        // @Ctx() {em}: MyContext
    ){
        // const user = await em.findOne(User, { email })
    }
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
        const errors = validateRegister(options);
        if (errors)
            return {errors};

        const hashedPassword = await argon2.hash(options.password);
        const user = em.create(User, {
            username: options.username, 
            email: options.email,
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
            console.log("error: ", err);
            if (err.sqlMessage.includes("for key 'user.user_email_unique'")){
                return {
                    errors: [{
                        field: "email",
                        message: "email already exists"
                    }]
                }
            }
            
            if (err.sqlState === "23000")
                return {
                    errors: [{
                        field: "username",
                        message: "username already exists",
                    }]
                }

            
        }

        req.session.userId = user.id; //storing user id in session
        return {
            user
        };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('username') username: string, //one way to do it or mention it specifically like in post
        @Arg('password') password: string,
        @Ctx() { em, req }: MyContext
        //or @Arg('options', () => UsernamePasswordInput)
    ): Promise<UserResponse> {
        const user = await em.findOne(User, {username});
        if (!user) {
            return { 
                errors: [{
                    field: "username",
                    message: 'that username doesnt exist'
                }]
            }
        }

        const valid = await argon2.verify( user.password ,password);
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