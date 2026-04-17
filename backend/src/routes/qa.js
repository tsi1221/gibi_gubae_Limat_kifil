const express = require('express');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/questions', async (req, res) => {
  try {
    const questions = await Question.find({ isHidden: false })
      .populate('author', 'name role')
      .populate({
        path: 'answers',
        match: { isHidden: false },
        populate: { path: 'author', select: 'name role' },
      })
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load questions' });
  }
});

router.post('/questions', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const question = await Question.create({
      title,
      content,
      author: req.user._id,
    });

    const populated = await question.populate('author', 'name role');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create question' });
  }
});

router.post('/questions/:id/answers', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Answer content is required' });
    }

    const question = await Question.findById(req.params.id);
    if (!question || question.isHidden) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const answer = await Answer.create({
      question: question._id,
      content,
      author: req.user._id,
    });

    question.answers.push(answer._id);
    await question.save();

    const populated = await Answer.findById(answer._id).populate('author', 'name role');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add answer' });
  }
});

router.post('/answers/:id/upvote', auth, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer || answer.isHidden) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const userId = req.user._id.toString();
    const existingIndex = answer.upvotes.findIndex((id) => id.toString() === userId);

    if (existingIndex >= 0) {
      answer.upvotes.splice(existingIndex, 1);
    } else {
      answer.upvotes.push(req.user._id);
    }

    await answer.save();

    res.json({ upvotesCount: answer.upvotes.length, upvoted: existingIndex === -1 });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update upvote' });
  }
});

module.exports = router;
