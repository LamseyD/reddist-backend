// import { Entity, PrimaryKey, Property } from "@mikro-orm/core"
import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Post } from "./Post";
@ObjectType()
@Entity()
export class User extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => String)
    @CreateDateColumn()
    createdAt = new Date();

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt = new Date();

    @Field(() => String) //if no field -> can't query it
    @Column({ unique: true })
    username!: string;

    @Field(() => String) //if no field -> can't query it
    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @OneToMany(() => Post, post => post.creator)
    posts!: Post[];
}