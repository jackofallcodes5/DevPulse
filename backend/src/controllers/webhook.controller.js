const webhookService = require('../services/webhook.service');
const { successResponse } = require('../utils/apiResponse');

const handleGitHubWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const deliveryId = req.headers['x-github-delivery'];
    const eventType = req.headers['x-github-event'];
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));

    const result = await webhookService.handleGitHubWebhook(
      rawBody,
      signature,
      deliveryId,
      eventType,
      req.body
    );

    return successResponse(res, result, 200, 'Webhook received');
  } catch (err) {
    return next(err);
  }
};

module.exports = { handleGitHubWebhook };
