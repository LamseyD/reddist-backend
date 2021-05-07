import DataLoader from 'dataloader';
import { Upvote } from '../entities/Upvote';

const voteLoader = () =>  new DataLoader<{postId: number; userId: number}, Upvote | null>(async (keys) => {
    const upvotes = await Upvote.findByIds(keys as any);
    const upvoteIdToUpvote: Record<string, Upvote> = {};
    upvotes.forEach (u => {
        upvoteIdToUpvote[`${u.userId}|${u.postId}`] = u;
    })
    console.log("map",upvoteIdToUpvote)
    return keys.map((key) => upvoteIdToUpvote[`${key.userId}|${key.postId}`])
});

export default voteLoader