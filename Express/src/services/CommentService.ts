import { db } from '../config/config';
import { CrudService } from './CrudService';
import { UserComment } from '../models/Comment';
import { reject } from 'bluebird';

export class CommentService implements CrudService<UserComment> {

    async findById(id: string): Promise<UserComment> {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM coments WHERE id=?";
            const values = [id];

            db.query(query, values)
                .then(rows => {
                    if (rows && rows.length > 0) {
                        resolve(rows[0])
                    } else reject({ error: "Not found" })
                })
                .catch(err => {
                    console.log(err.message);
                })
        });
    }

    findAll(offset = 0): Promise<UserComment[]> {
        return new Promise((resolve, reject) => {
            const query = "SELECT *  FROM coment LIMIT ?, 5";
            const values = [offset];
            db.query(query, values)
                .then(rows => {
                    resolve(rows);
                })
                .catch(err => {
                    console.log(err);
                    reject({ error: err });
                })
        });
    }

    async createOne(newComment: UserComment): Promise<UserComment> {
        try {
            const query = `
            INSERT INTO
            comments(content, post_id, user_id)
            VALUES(?, ?, ?)
            `;
            const values = [
                newComment.content,
                newComment.postId,
                newComment.userId
            ];

            const insert = await db.query(query, values);
            const insertedComment = await this.findById(insert.insertId);
            return insertedComment;
        } catch (err) {
            console.log(err.message);
            throw { error: err.message };
        }
    }

    updateOne(id: string, updateComment: UserComment): Promise<UserComment> {
        return new Promise((resolve, reject) => {

            const sel = `
            UPDATE comments
            SET content=COALESCE(?, content),
            picture=COALESCE(?, picture)
            WHERE id=?
            `;

            const values = [
                updateComment.content,
                updateComment.picture,
                id
            ];

            db.query(sel, values)
                .then(rows => {
                    if (rows && rows.affectedRows > 0) {
                        this.findById(id)
                            .then(updateComment => resolve(updateComment))
                            .catch(err => reject({ error: err }));
                    } else reject({ error: "Not found" })
                })
                .catch(err => {
                    console.log(err);
                    reject({ error: err })
                })
        });
    }

    deleteOne(id: string): Promise<UserComment> {
        return new Promise((resolve, reject) => {

            const sel = `DELETE FROM comments WHERE id=?`;
            const values = [id];

            db.query(sel, values)
                .then(rows => {
                    if (rows && rows.affectedRows > 0) {
                        this.findById(id)
                            .then(updateComment => resolve(updateComment))
                            .catch(err => reject({ error: err }));
                    } else reject({ error: "Not found" })
                })
                .catch(err => {
                    console.log(err);
                    reject({ error: err })
                })
        });
    }

    likeOne(postId: string, userId: string): Promise<UserComment> {
        return new Promise((resolve, reject) => {
            const query = `
            INSERT INTO
            comments_have_likes(post_id, user_id)
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

    dislikeOne(postId: string, userId: string): Promise<UserComment> {
        return new Promise((resolve, reject) => {
            const query = `
            DELETE FROM comments_have_likes
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

}
