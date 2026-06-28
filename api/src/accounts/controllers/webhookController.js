const { successResponse, errorResponse } = require("../../middleware/apiResponse");
const {
  createEndpoint,
  getEndpointById,
  listEndpoints,
  updateEndpoint,
  deleteEndpoint,
  listDeliveries,
} = require("../services/webhookService");

const getWebhooks = async (req, res) => {
  try {
    const accountId = req.account.id;
    const endpoints = await listEndpoints(accountId);
    return successResponse(res, endpoints, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const getWebhook = async (req, res) => {
  try {
    const endpoint = await getEndpointById(req.params.webhookId);
    if (!endpoint || endpoint.accountId !== req.account.id) {
      return errorResponse(res, 404, "Webhook not found", { requestId: req.requestId });
    }
    return successResponse(res, endpoint, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const createWebhook = async (req, res) => {
  try {
    const endpoint = await createEndpoint({
      ...req.validatedBody,
      accountId: req.account.id,
      createdBy: req.user?.id || null,
    });
    return successResponse(res, endpoint, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const updateWebhookById = async (req, res) => {
  try {
    const existing = await getEndpointById(req.params.webhookId);
    if (!existing || existing.accountId !== req.account.id) {
      return errorResponse(res, 404, "Webhook not found", { requestId: req.requestId });
    }
    const endpoint = await updateEndpoint(req.params.webhookId, req.account.id, req.validatedBody);
    return successResponse(res, endpoint, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const deleteWebhook = async (req, res) => {
  try {
    const existing = await getEndpointById(req.params.webhookId);
    if (!existing || existing.accountId !== req.account.id) {
      return errorResponse(res, 404, "Webhook not found", { requestId: req.requestId });
    }
    await deleteEndpoint(req.params.webhookId, req.account.id);
    return successResponse(res, { deleted: true }, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

const getWebhookDeliveries = async (req, res) => {
  try {
    const existing = await getEndpointById(req.params.webhookId);
    if (!existing || existing.accountId !== req.account.id) {
      return errorResponse(res, 404, "Webhook not found", { requestId: req.requestId });
    }
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
    const deliveries = await listDeliveries(req.params.webhookId, { limit, offset, status: req.query.status });
    return successResponse(res, deliveries, { requestId: req.requestId });
  } catch (err) {
    return errorResponse(res, 500, err.message, { requestId: req.requestId });
  }
};

module.exports = {
  getWebhooks,
  getWebhook,
  createWebhook,
  updateWebhookById,
  deleteWebhook,
  getWebhookDeliveries,
};
