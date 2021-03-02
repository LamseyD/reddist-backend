import { Connection, IDatabaseDriver, EntityManager } from "@mikro-orm/core";
import { Request, Response } from 'express';
import { Session } from 'express-session';

export type MyContext = {
    em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
    req: Request & { session: Session }; // \? means possible undefined & joins 2 types together
    res: Response;
}