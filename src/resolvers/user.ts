import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Resolver, Mutation, InputType, Field, Arg, Ctx, ObjectType } from "type-graphql";
import argon2 from "argon2";

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

    @Field(() => [User], {nullable: true})
    user?: User
}

@Resolver()
export class UserResolver{
    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput, //one way to do it or mention it specifically like in post
        @Ctx() {em}: MyContext
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
        const user = em.create(User, {username: options.username, password: hashedPassword});
        await em.persistAndFlush(user);
        return {
            user
        };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('options') options: UsernamePasswordInput, //one way to do it or mention it specifically like in post
        @Ctx() {em}: MyContext
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

            }
        }
        return {
            user
        };
    }
}