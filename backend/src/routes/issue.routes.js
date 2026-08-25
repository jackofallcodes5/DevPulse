const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issue.controller');
const { authenticate } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const {
  createIssueSchema,
  updateIssueSchema,
  issueFiltersSchema,
} = require('../validators/issue.validators');

router.use(authenticate);

// Project-scoped issue endpoints
router.get(
  '/projects/:projectId/issues',
  requireProjectMember('VIEWER'),
  validate({ query: issueFiltersSchema }),
  issueController.getProjectIssues
);

router.get(
  '/projects/:projectId/kanban',
  requireProjectMember('VIEWER'),
  issueController.getKanbanBoard
);

router.post(
  '/projects/:projectId/issues',
  requireProjectMember('DEVELOPER'),
  validate({ body: createIssueSchema }),
  issueController.createIssue
);

// Individual issue endpoints
router.get('/issues/:id', issueController.getIssueById);
router.patch('/issues/:id', validate({ body: updateIssueSchema }), issueController.updateIssue);
router.delete('/issues/:id', issueController.deleteIssue);

module.exports = router;
