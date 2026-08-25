const githubRepo = require('../repositories/github.repository');
const { verifyWebhookSignature } = require('../integrations/github');
const { githubEventQueue } = require('../queues');
const config = require('../config/env');
const logger = require('../utils/logger');

const handleGitHubWebhook = async (rawBody, signatureHeader, deliveryId, eventType, payload) => {
  // 1. Signature Verification
  const secret = config.github.webhookSecret;
  if (secret) {
    const isValid = verifyWebhookSignature(rawBody, signatureHeader, secret);
    if (!isValid) {
      const err = new Error('Invalid X-Hub-Signature-256 signature');
      err.statusCode = 401;
      err.errorCode = 'INVALID_WEBHOOK_SIGNATURE';
      throw err;
    }
  }

  // 2. Idempotency Check
  if (deliveryId) {
    const existing = await githubRepo.findEventByDeliveryId(deliveryId);
    if (existing) {
      logger.info('Duplicate GitHub webhook delivery ignored', { deliveryId });
      return { success: true, duplicate: true };
    }
  }

  // 3. Store Event
  const repoGithubId = payload.repository?.id;
  let repositoryId = null;
  if (repoGithubId) {
    const repo = await githubRepo.findRepoByGithubId(repoGithubId);
    if (repo) repositoryId = repo.id;
  }

  const event = await githubRepo.createEvent({
    deliveryId: deliveryId || `del_${Date.now()}_${Math.random()}`,
    event: eventType,
    action: payload.action || null,
    repositoryId,
    payload,
  });

  // 4. Enqueue BullMQ Job for async processing
  await githubEventQueue.add(
    'process-webhook',
    {
      eventId: event.id,
      eventType,
      payload,
    },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    }
  );

  return { success: true, eventId: event.id };
};

module.exports = { handleGitHubWebhook };
