const express = require('express');
const router = express.Router();
const githubController = require('../controllers/github.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/repositories', githubController.getRepositories);
router.post('/repositories/connect', githubController.connectRepository);
router.delete('/repositories/:id', githubController.disconnectRepository);
router.get('/repositories/:id/commits', githubController.getCommits);
router.get('/repositories/:id/pulls', githubController.getPullRequests);
router.get('/repositories/:id/branches', githubController.getBranches);

module.exports = router;
