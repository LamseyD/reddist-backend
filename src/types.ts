// import { Connection, IDatabaseDriver, EntityManager } from "@mikro-orm/core";
import { Request, Response } from 'express';
import { Session } from 'express-session';
import { Redis } from "ioredis";
import creatorLoader from './utils/creatorLoader';
import voteLoader from './utils/voteLoader';

export type MyContext = {
    // em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
    req: Request & { session: Session & { userId: number}}; // \? means possible undefined & joins 2 types together
    res: Response;
    redisClient: Redis;
    userLoader: ReturnType<typeof creatorLoader>
    voteLoader: ReturnType<typeof voteLoader>
}