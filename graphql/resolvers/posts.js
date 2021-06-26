const { AuthenticationError, UserInputError } = require("apollo-server")
const Post = require("../../db/models/Post")
const checkAuth = require("../../util/check-auth")
module.exports = {
    Query: {
        async getPosts() {
            try {
                const posts = await Post.find().sort({ createdAt: -1 }) //-1 is most recent first, 1 is oldest first
                return posts
            } catch (error) {
                throw new Error(error)
            }
        },
        async getPost(_, { postId }) {
            try {
                const post = await Post.findById(postId)
                if (post) {
                    return post
                } else {
                    throw new Error("Post not found")
                }
            } catch (err) {
                throw new Error(err)
            }
        },
        async getLikes(_, { postId }) {
            const post = await Post.findById(postId)
            if (post) {
                return post.likes.length
            } else {
                throw new UserInputError("Post does not exist")
            }
        },
    },

    Mutation: {
        async createPost(_, { body }, context) {
            //user logs in, gets auth token
            //puts into an authorization header w/ request
            //get token, decrypt, and then
            //mistake: adding authentication middleware as middleware for express itself
            const user = checkAuth(context)
            console.log("user>>>>", user)
            const newPost = new Post({
                body,
                user: user.id,
                username: user.username,
                createdAt: new Date().toISOString(),
            })
            const post = await newPost.save()
            return post
        },
        async deletePost(_, { postId }, context) {
            const user = checkAuth(context)
            try {
                const post = await Post.findById(postId)
                if (user.username === post.username) {
                    await post.delete()
                    return "Post deleted successfully"
                } else {
                    throw new AuthenticationError("Action not allowed")
                }
            } catch (error) {
                throw new Error(error)
            }
        },
        async likePost(_, { postId }, context) {
            const { username } = checkAuth(context)
            const post = await Post.findById(postId)
            if (post) {
                if (post.likes.find(like => like.username === username)) {
                    //post already liked, unlike it
                    post.likes = post.likes.filter(
                        like => like.username !== username
                    )
                } else {
                    post.likes.push({
                        username,
                        createdAt: new Date().toISOString(),
                    })
                }
                await post.save()
                return post
            } else throw new UserInputError("Post not found")
        },
    },
}
