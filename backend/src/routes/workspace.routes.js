const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspace.controller');
const { authenticate } = require('../middleware/auth');
const { requireWorkspaceMember } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} = require('../validators/workspace.validators');

router.use(authenticate);

router.get('/', workspaceController.getWorkspaces);
router.post('/', validate({ body: createWorkspaceSchema }), workspaceController.createWorkspace);

router.get('/:id', requireWorkspaceMember('VIEWER'), workspaceController.getWorkspaceById);
router.patch('/:id', requireWorkspaceMember('ADMIN'), validate({ body: updateWorkspaceSchema }), workspaceController.updateWorkspace);
router.delete('/:id', requireWorkspaceMember('OWNER'), workspaceController.deleteWorkspace);

// Members
router.get('/:id/members', requireWorkspaceMember('VIEWER'), workspaceController.getMembers);
router.post('/:id/members', requireWorkspaceMember('ADMIN'), validate({ body: inviteMemberSchema }), workspaceController.inviteMember);
router.patch('/:id/members/:userId', requireWorkspaceMember('ADMIN'), validate({ body: updateMemberRoleSchema }), workspaceController.updateMemberRole);
router.delete('/:id/members/:userId', requireWorkspaceMember('ADMIN'), workspaceController.removeMember);

module.exports = router;
