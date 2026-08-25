const { z } = require('zod');

const createMonitorSchema = z.object({
  name: z.string().min(1, 'Monitor name is required').max(100),
  url: z.string().url('Invalid URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'HEAD', 'OPTIONS']).default('GET'),
  expectedStatus: z.number().int().min(100).max(599).default(200),
  intervalMinutes: z.number().int().min(1).max(1440).default(5),
  timeoutSeconds: z.number().int().min(5).max(120).default(30),
  active: z.boolean().default(true),
  workspaceId: z.string().uuid('Invalid workspace ID'),
  projectId: z.string().uuid().nullable().optional(),
});

const updateMonitorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'HEAD', 'OPTIONS']).optional(),
  expectedStatus: z.number().int().min(100).max(599).optional(),
  intervalMinutes: z.number().int().min(1).max(1440).optional(),
  timeoutSeconds: z.number().int().min(5).max(120).optional(),
  active: z.boolean().optional(),
});

module.exports = { createMonitorSchema, updateMonitorSchema };
