const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticate } = require('../middleware/auth');
const { requireProjectMember } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
} = require('../validators/project.validators');

router.use(authenticate);

router.get('/', projectController.getProjects);
router.post('/', validate({ body: createProjectSchema }), projectController.createProject);

router.get('/:id', requireProjectMember('VIEWER'), projectController.getProjectById);
router.patch('/:id', requireProjectMember('ADMIN'), validate({ body: updateProjectSchema }), projectController.updateProject);
router.delete('/:id', requireProjectMember('ADMIN'), projectController.deleteProject);

// Members
router.get('/:id/members', requireProjectMember('VIEWER'), projectController.getMembers);
router.post('/:id/members', requireProjectMember('ADMIN'), validate({ body: addProjectMemberSchema }), projectController.addMember);

module.exports = router;
