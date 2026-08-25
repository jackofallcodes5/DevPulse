const workspaceRepo = require('../repositories/workspace.repository');
const userRepo = require('../repositories/user.repository');
const activityRepo = require('../repositories/activity.repository');
const { getIO } = require('../websockets');

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const createWorkspace = async (userId, { name, slug }) => {
  const finalSlug = slug || generateSlug(name) + '-' + Math.floor(Math.random() * 1000);

  const existing = await workspaceRepo.findBySlug(finalSlug);
  if (existing) {
    const err = new Error('Workspace slug is already in use');
    err.statusCode = 409;
    err.errorCode = 'SLUG_TAKEN';
    throw err;
  }

  const workspace = await workspaceRepo.create({
    name,
    slug: finalSlug,
    ownerId: userId,
  });

  await activityRepo.create({
    workspaceId: workspace.id,
    userId,
    type: 'WORKSPACE_CREATED',
    payload: { name: workspace.name, slug: workspace.slug },
  });

  return workspace;
};

const getUserWorkspaces = async (userId) => {
  return workspaceRepo.findByUserId(userId);
};

const getWorkspaceById = async (workspaceId) => {
  const workspace = await workspaceRepo.findById(workspaceId);
  if (!workspace) {
    const err = new Error('Workspace not found');
    err.statusCode = 404;
    err.errorCode = 'WORKSPACE_NOT_FOUND';
    throw err;
  }
  return workspace;
};

const updateWorkspace = async (workspaceId, data) => {
  if (data.slug) {
    const existing = await workspaceRepo.findBySlug(data.slug);
    if (existing && existing.id !== workspaceId) {
      const err = new Error('Workspace slug is already taken');
      err.statusCode = 409;
      err.errorCode = 'SLUG_TAKEN';
      throw err;
    }
  }

  return workspaceRepo.update(workspaceId, data);
};

const deleteWorkspace = async (workspaceId) => {
  return workspaceRepo.remove(workspaceId);
};

const getWorkspaceMembers = async (workspaceId) => {
  return workspaceRepo.findMembers(workspaceId);
};

const inviteMember = async (workspaceId, { email, role }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    const err = new Error('User with this email not found');
    err.statusCode = 404;
    err.errorCode = 'USER_NOT_FOUND';
    throw err;
  }

  const existingMember = await workspaceRepo.findMember(workspaceId, user.id);
  if (existingMember) {
    const err = new Error('User is already a member of this workspace');
    err.statusCode = 409;
    err.errorCode = 'ALREADY_MEMBER';
    throw err;
  }

  const member = await workspaceRepo.addMember(workspaceId, user.id, role);

  const io = getIO();
  if (io) {
    io.to(`workspace:${workspaceId}`).emit('workspace:member_joined', member);
  }

  return member;
};

const updateMemberRole = async (workspaceId, memberUserId, role) => {
  return workspaceRepo.updateMemberRole(workspaceId, memberUserId, role);
};

const removeMember = async (workspaceId, memberUserId) => {
  const workspace = await workspaceRepo.findById(workspaceId);
  if (workspace.ownerId === memberUserId) {
    const err = new Error('Cannot remove owner from workspace');
    err.statusCode = 400;
    err.errorCode = 'CANNOT_REMOVE_OWNER';
    throw err;
  }

  return workspaceRepo.removeMember(workspaceId, memberUserId);
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
};
