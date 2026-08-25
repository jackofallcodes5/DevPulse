const { z } = require('zod');

const createCommentSchema = z.object({
  body: z.string().min(1, 'Comment body is required').max(50000),
});

const updateCommentSchema = z.object({
  body: z.string().min(1, 'Comment body is required').max(50000),
});

module.exports = { createCommentSchema, updateCommentSchema };
