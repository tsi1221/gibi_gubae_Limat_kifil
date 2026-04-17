const express = require('express');
const Post = require('../models/Post');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(auth, requireAdmin);

router.get('/dashboard', async (req, res) => {
  try {
    const [posts, questions, answers] = await Promise.all([
      Post.find().populate('author', 'name role').sort({ createdAt: -1 }),
      Question.find().populate('author', 'name role').sort({ createdAt: -1 }),
      Answer.find().populate('author', 'name role').sort({ createdAt: -1 }),
    ]);

    res.json({ posts, questions, answers });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load admin data' });
  }
});

router.patch('/posts/:id/toggle-visibility', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.isHidden = !post.isHidden;
    await post.save();
    res.json({ id: post._id, isHidden: post.isHidden });
  } catch (error) {
    res.status(500).json({ message: 'Failed to moderate post' });
  }
});

router.patch('/questions/:id/toggle-visibility', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    question.isHidden = !question.isHidden;
    await question.save();
    res.json({ id: question._id, isHidden: question.isHidden });
  } catch (error) {
    res.status(500).json({ message: 'Failed to moderate question' });
  }
});

router.patch('/answers/:id/toggle-visibility', async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    answer.isHidden = !answer.isHidden;
    await answer.save();
    res.json({ id: answer._id, isHidden: answer.isHidden });
  } catch (error) {
    res.status(500).json({ message: 'Failed to moderate answer' });
  }
});

module.exports = router;
