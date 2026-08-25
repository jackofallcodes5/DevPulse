const express = require('express');
const router = express.Router();
const monitorController = require('../controllers/monitor.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createMonitorSchema, updateMonitorSchema } = require('../validators/monitor.validators');

router.use(authenticate);

router.get('/', monitorController.getMonitors);
router.post('/', validate({ body: createMonitorSchema }), monitorController.createMonitor);
router.get('/:id', monitorController.getMonitorById);
router.patch('/:id', validate({ body: updateMonitorSchema }), monitorController.updateMonitor);
router.patch('/:id/toggle', monitorController.toggleMonitor);
router.delete('/:id', monitorController.deleteMonitor);

router.get('/:id/checks', monitorController.getChecks);
router.get('/:id/incidents', monitorController.getIncidents);

module.exports = router;
