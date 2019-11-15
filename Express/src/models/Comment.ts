import { User } from './User';

export interface UserComment {
    id?: string;
    userId?: string;
    postId?: string;
    content?: string;
    likes?: User[];
    picture?: string;
    error?: string;
}
