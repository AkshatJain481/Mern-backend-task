
const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const router = express.Router();

// Create a post
router.post('/posts', async (req, res) => {
  const { userId,  title, description , mediaUrl} = req.body;

  try {
    const post = new Post({ user: userId , title , description , mediaUrl });
    await post.save();
    res.status(201).send(post);
  } catch (error) {
    res.status(400).send({ error: 'Failed to create post', details: error });
  }
});

// Read all posts
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', '-password') // Assuming you want to exclude the password
      .populate('likes', '-password')
      .populate('comments.user', '-password');
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(400).json({ error: 'Failed to fetch posts', details: error.message });
  }
});

// Update a post
router.put('/posts/:id', async (req, res) => {
  const { title , description , mediaUrl , userId } = req.body;
  console.log("below key is userId");
  console.log(userId);
  console.log(req.params.id);
  try {
    const post = await Post.findOneAndUpdate({ _id : req.params.id , user: userId }, { title: title , description: description , mediaUrl: mediaUrl }, { new: true });
    console.log(post);
    res.status(200).send(post);
  } catch (error) {
    res.status(400).send({ error: 'Failed to update post', details: error });
  }
});

// Delete a post
router.delete('/posts/:id', async (req, res) => {
  const { UserId } = req.query;
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, user: UserId });
    if(!post) return res.status(404).send({ error: 'Post not created by this email' });
    else{

     return res.status(200).send({ message: 'Post deleted successfully' });
    }
  } catch (error) {
    res.status(400).send({ error: 'Failed to delete post', details: error });
  }
});

// Like a post
router.post('/posts/:id/like', async (req, res) => {
  const { CurrentuserId } = req.body;

  try {
    const post = await Post.findById(req.params.id);
    if (post.likes.includes(CurrentuserId)) {
      post.likes.pull(CurrentuserId);
    } else {  
      post.likes.push(CurrentuserId);
    }
    await post.save();
    res.status(200).send(post.likes);
  } catch (error) {
    res.status(400).send({ error: 'Failed to like/unlike post', details: error });
  }
});

// Comment on a post
router.post('/posts/:id/comment', async (req, res) => {
  const { CommentuserId, text } = req.body;
  
  try {
    const post = await Post.findById(req.params.id);
    post.comments.push({ text, user: CommentuserId });
    await post.save();
    console.log(post.comments);
    res.status(200).send(post.comments);
  } catch (error) {
    console.error('Error commenting on post:', error);
    res.status(400).send({ error: 'Failed to comment on post', details: error });
  }
});

module.exports = router;
