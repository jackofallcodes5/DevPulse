const { z } = require('zod');

const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  key: z
    .string()
    .min(2, 'Key must be 2-10 characters')
    .max(10)
    .regex(/^[A-Z0-9]+$/, 'Key must be uppercase letters and numbers only')
    .optional(),
  workspaceId: z.string().uuid('Invalid workspace ID'),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

const addProjectMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['ADMIN', 'DEVELOPER', 'VIEWER']).default('DEVELOPER'),
});

module.exports = { createProjectSchema, updateProjectSchema, addProjectMemberSchema };
