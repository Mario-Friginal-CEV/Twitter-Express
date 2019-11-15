import { db } from '../config/config';
import { Post } from '../models/Post';
import { UserComment } from '../models/Comment';
import { User } from '../models/User';
import { MultipleCrudService } from './MultipleCrudService';


export class PostService implements MultipleCrudService<Post> {

    async findById(id: string): Promise<Post> {
        try {
            const query = `
            SELECT
            id,
            owner_id as userId,
            content,
            post_timestamp as timestamp,
            picture
            FROM posts
            WHERE id=?
            `;
            const values = [id];

            const rows = await db.query(query, values)
            if (rows && rows.lenght > 0) {
                const post: Post = rows[0];
                const comments: UserComment[] = await this.findComments(id);
                const likes: User[] = await this.findLikes(id);
                post.comments = comments;
                post.likes = likes;
                return post;
            } else throw ({ error: "Not found" })
        } catch (err) {
            console.log(err);
            throw ({ error: err });
        }
    }

    findAll(offset = 0): Promise<Post[]> {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM posts LIMIT ?, 25";
            const values = [offset];
            db.query(query, values)
                .then(rows => {
                    resolve(rows);
                })
                .catch(err => {
                    console.log(err);
                    reject({ error: err });
                })
        })
    }

    async createOne(newPost: Post): Promise<Post> {
        try {
            const query = `
            INSERT INTO
            posts(content, picture, owner_id)
            VALUES(?, ?, ?)
            `;
            const values = [
                newPost.content,
                newPost.picture,
                newPost.userId
            ];

            const insert = await db.query(query, values);
            const q2 = 'INSERT INTO users_have_posts(post_id, user_id) VALUES(?, ?)';
            const val2 = [insert.insertId, newPost.userId];
            const insertToTweets = db.query(q2, val2);
            const insertedComment = await this.findById(insert.insertId);
            return insertedComment;
        } catch (err) {
            console.log(err.message)
            throw { error: err.message };
        }
    }

    updateOne(id: string, updatePost: Post): Promise<Post> {
        return new Promise((resolve, reject) => {
            const sel = `
            UPDATE posts
            SET content=COALESCE(?, content),
            picture=COALESCE(?, picture)
            WHERE id=?
            `;

            const values = [
                updatePost.content,
                updatePost.picture,
                id
            ];

            db.query(sel, values)
                .then(rows => {
                    if (rows && rows.affectedRows > 0) {
                        this.findById(id)
                            .then(updatePost => resolve(updatePost))
                            .catch(err => reject({ error: err }));
                    } else reject({ error: "Not found" })
                })
                .catch(err => {
                    console.log(err);
                    reject({ error: err })
                })
        });
    }

    deleteOne(id: string): Promise<Post> {
        return new Promise((resolve, reject) => {
            const sel = 'DELETE FROM posts WHERE id=?'
            const values = [id];

            db.query(sel, values)
                .then(rows => {

                    if (rows && rows.affectedRows > 0) {
                        resolve({ id: id })
                    } else reject({ error: "Not found" })
                })
                .catch(err => {
                    console.log(err.message);
                    reject({ error: "Not found" })
                })
        });
    }

    likeOne(postId: string, userId: string): Promise<Post> {
        return new Promise((resolve, reject) => {
            const query = `
            INSERT INTO
            posts_have_likes(post_id, user_id)
            VALUES(?, ?)
            `;

            const values = [postId, userId];

            db.query(query, values)
                .then(rows => {
                    if (rows && rows.affectedRows > 0) {
                        resolve({ id: rows.insertId })
                    } else reject({ error: "Not found" })
                })
                .catch(err => {
                    console.log(err.message);
                    reject({ error: "Not found" })
                })
        });
    }

    dislikeOne(postId: string, userId: string): Promise<Post> {
        return new Promise((resolve, reject) => {
            const query = `
            DELETE FROM posts_have_likes
            WHERE post_id=? AND user=?
            `;

            const values = [postId, userId];

            db.query(query, values)
                .then(rows => {
                    if (rows && rows.affectedRows > 0) {
                        resolve({ id: rows.insertId })
                    } else reject({ error: "Not found" })
                })
                .catch(err => {
                    console.log(err.message);
                    reject({ error: "Not found" })
                })
        });
    }

    async findUserObjects(userId: string, offset = 0): Promise<Post[]> {
        try {
            const query = `
            SELECT 
            post_id as postId
            FROM users_have_post
            WHERE user_id=?
            LIMIT ?, 25
            `;
            const values = [userId, offset];

            const rows = await db.query(query, values);
            let results = [];
            if (rows && rows.length > 0) {
                results = rows.map(async e => this.findById(e.postId));
                return Promise.all(results);
            } else return results;
        } catch (err) {
            console.log(err.message)
            throw { error: err.message };
        }
    }

    findComments(postId: string): Promise<UserComment[]> {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id, content, user_id as userId
                FROM comments
                WHERE post_id=?
            `;
            const values = [postId];

            db.query(sql, values)
                .then(rows => {
                    if (rows && rows.length > 0) {
                        resolve(rows);
                    } else reject({ error: "Not found" })
                })
                .catch(err => {
                    console.log(err.message);
                })
        });
    }

    findLikes(postId: string): Promise<User[]> {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id, user_id as userId
                FROM posts_have_likes
                WHERE post_id=?
            `;
            const values = [postId];

            db.query(sql, values)
                .then(rows => {
                    if (rows && rows.lenght > 0) {
                        resolve(rows);
                    } else resolve([])
                })
                .catch(err => {
                    console.log(err);
                    reject({ error: err });
                })
        });
    }
}