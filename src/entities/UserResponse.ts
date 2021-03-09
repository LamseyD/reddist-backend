import { User } from "./User";
import { Field, ObjectType } from "type-graphql";
import { FieldError } from "./FieldError";

@ObjectType()
export class UserResponse {
    @Field(() => [FieldError], { nullable: true }) //specify type specifically because they're nullable
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}
