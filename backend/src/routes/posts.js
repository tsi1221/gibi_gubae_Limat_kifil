const express = require('express');
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({ isHidden: false })
      .populate('author', 'name role')
      .populate('comments.user', 'name role')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load posts' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const post = await Post.create({
      title,
      content,
      category,
      author: req.user._id,
    });

    const populated = await post.populate('author', 'name role');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create post' });
  }
});

router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post || post.isHidden) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({ user: req.user._id, content });
    await post.save();

    const updated = await Post.findById(post._id).populate('author', 'name role').populate('comments.user', 'name role');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isHidden) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id.toString();
    const existingIndex = post.likes.findIndex((id) => id.toString() === userId);

    if (existingIndex >= 0) {
      post.likes.splice(existingIndex, 1);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    res.json({ likesCount: post.likes.length, liked: existingIndex === -1 });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update like' });
  }
});

module.exports = router;
