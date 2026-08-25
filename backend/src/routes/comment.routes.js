const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createCommentSchema, updateCommentSchema } = require('../validators/comment.validators');

router.use(authenticate);

router.get('/issues/:issueId/comments', commentController.getIssueComments);
router.post('/issues/:issueId/comments', validate({ body: createCommentSchema }), commentController.createComment);

router.patch('/comments/:id', validate({ body: updateCommentSchema }), commentController.updateComment);
router.delete('/comments/:id', commentController.deleteComment);

module.exports = router;
