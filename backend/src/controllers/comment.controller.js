const commentService = require('../services/comment.service');
const { successResponse } = require('../utils/apiResponse');

const createComment = async (req, res, next) => {
  try {
    const issueId = req.params.issueId;
    const comment = await commentService.createComment(issueId, req.user.id, req.body.body);
    return successResponse(res, { comment }, 201, 'Comment added successfully');
  } catch (err) {
    return next(err);
  }
};

const getIssueComments = async (req, res, next) => {
  try {
    const issueId = req.params.issueId;
    const comments = await commentService.getIssueComments(issueId);
    return successResponse(res, { comments });
  } catch (err) {
    return next(err);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const comment = await commentService.updateComment(req.params.id, req.user.id, req.body.body);
    return successResponse(res, { comment }, 200, 'Comment updated successfully');
  } catch (err) {
    return next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    await commentService.deleteComment(req.params.id, req.user.id);
    return successResponse(res, null, 200, 'Comment deleted successfully');
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  createComment,
  getIssueComments,
  updateComment,
  deleteComment,
};
