import { User } from "../entities/User";
import { MyContext } from "../types";
import { Resolver, Mutation, Arg, Ctx, Query, FieldResolver, Root } from "type-graphql";
import argon2 from "argon2";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "../entities/UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { UserResponse } from "../entities/UserResponse";
import { sendEmail } from "../utils/sendEmail";
import {v4} from 'uuid';
// import { getConnection } from "typeorm";

@Resolver(User)
export class UserResolver{
    //email only accessible if user is logged in
    @FieldResolver(() => String)
    email(
        @Root() user: User,
        @Ctx() {req}: MyContext
    ): string{
        if (req.session.userId === user.id){
            return user.email;
        }
        return "";
    }

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() {redisClient, req}: MyContext // add entitymanager if use mikro orm
    ): Promise<UserResponse>{
        if (newPassword.length <= 3){
            return {
                errors:[{
                    field: "password",
                    message: "length must be greater than 3"
                }]
            } 
        }

        const userId = await redisClient.get(FORGOT_PASSWORD_PREFIX + token)
        if (!userId) {
            return {
                errors: [{
                    field: "token",
                    message: "token has expired"
                }]
            }
        }

        // const user = await em.findOne(User, {id: parseInt(userId)});
        const user = await User.findOne(parseInt(userId));
        if (!user){
            return {
                errors: [{
                    field: "token",
                    message: "user no longer exists"
                }]
            }
        } 

        user.password = await argon2.hash(newPassword);
        // em.persistAndFlush(user);

        User.update({id: parseInt(userId)}, {password: user.password})

        await redisClient.del(FORGOT_PASSWORD_PREFIX + token);

        req.session.userId = user.id;

        return { user };
    }
    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() { redisClient }: MyContext // add entity manager if mikro orm
    ){
        // const user = await em.findOne(User, { email })
        const user = await User.findOne({where: {email}}); //if searching by non primary key, need to use where
        if (!user){
            return true;
        }
        const token = v4();
        await redisClient.set(FORGOT_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 24);//set a prefix
        await sendEmail(email, `<a href="http://localhost:3000/changePassword/${token}"> reset password </a>`)
        return true;
    }
    @Query(() => User, {nullable: true})
    async me(
        @Ctx() { req }: MyContext // add entity manager if mikro orm
    ): Promise<User | undefined> {
        // @ts-ignore: type for userId missing here
        if (!req.session?.userId)
            return;

        // @ts-ignore: type for userId missing here
        // const user = await em.findOne(User, {id: req.session.userId});
        const user = await User.findOne(req.session.userId);
        return user;
    }
    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput, //one way to do it or mention it specifically like in post
        @Ctx() { req }: MyContext // add entity manager if mikro orm
        //or @Arg('options', () => UsernamePasswordInput)
    ): Promise<UserResponse>{
        const errors = validateRegister(options);
        if (errors)
            return {errors};

        const hashedPassword = await argon2.hash(options.password);
        //? create user with mikro orm - easy way
        // const user = em.create(User, {
        //     username: options.username, 
        //     email: options.email,
        //     password: hashedPassword});
        // let user;

        //? create user with type orm - easy way
        const user = User.create({        
            username: options.username, 
            email: options.email,
            password: hashedPassword});
        try {
            //? entity builder with Typeorm
            // const result = await getConnection().createQueryBuilder().insert().into(User).values({
            //     username: options.username, 
            //     email: options.email,
            //     password: hashedPassword}).execute();

            // console.log("result: ", result);
            // user = result.raw[0];
            //? entity builder using Knex with mikro orm
            // const result = await (em as EntityManager).createQueryBuilder(User).getKnexQuery().insert(
            //     {
            //         username: options.username,
            //         password: hashedPassword,
            //         created_at: new Date(),
            //         updated_at: new Date()
            //     }
            // ).returning("*");
            // user = result[0];

            //? using mikro orm - easy way
            // await em.persistAndFlush(user);


            //? using type orm - easy way
            await user.save();
            console.log(user);
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
        @Ctx() { req }: MyContext // add entity manager if mikro orm
        //or @Arg('options', () => UsernamePasswordInput)
    ): Promise<UserResponse> {
        // const user = await em.findOne(User, {username});
        const user = await User.findOne({where: {username}})
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