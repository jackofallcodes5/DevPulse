const activityRepo = require('../repositories/activity.repository');
const { successResponse } = require('../utils/apiResponse');

const getProjectActivity = async (req, res, next) => {
  try {
    const activities = await activityRepo.findByProject(req.params.projectId, parseInt(req.query.limit, 10) || 50);
    return successResponse(res, { activities });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getProjectActivity };
