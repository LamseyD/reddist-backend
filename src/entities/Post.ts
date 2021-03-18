// import { Entity, PrimaryKey, Property } from "@mikro-orm/core"
import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { User } from "./User";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
	@Field(() => Int)
	@PrimaryGeneratedColumn()
	id!: number;

	@Field(() => String)
	@CreateDateColumn()
	createdAt = new Date();

	@Field(() => String)
	@UpdateDateColumn()
	updatedAt = new Date();

	@Field()
	@Column()
	title!: string;

	//create a foreign key to user
	@ManyToOne(() => User, user => user.posts)
    creator!: User;
	
	@Field()
	@Column()
	creatorId!: number;

	@Field()
	@Column()
	text!: string;

	@Field()
	@Column({type: "int", default: 0})
	points!: number;
}