import { InputType, Field } from "type-graphql";

// import {EntityManager} from "@mikro-orm/mysql";
@InputType()
export class UsernamePasswordInput {
    @Field()
    username!: string;
    @Field()
    email!: string;
    @Field() //put arguments in here to overwrite types below
    password!: string; // \! is a definite assertion assignment -> tells typescript that it is indeed correct
}
