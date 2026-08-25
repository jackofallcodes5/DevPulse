const projectRepo = require('../repositories/project.repository');
const activityRepo = require('../repositories/activity.repository');
const { getIO } = require('../websockets');

const createProject = async (userId, data) => {
  const key = data.key || (await projectRepo.generateKey(data.workspaceId, data.name));

  const project = await projectRepo.create({
    name: data.name,
    description: data.description,
    key,
    workspaceId: data.workspaceId,
    createdById: userId,
  });

  await activityRepo.create({
    projectId: project.id,
    workspaceId: data.workspaceId,
    userId,
    type: 'PROJECT_CREATED',
    payload: { name: project.name, key: project.key },
  });

  const io = getIO();
  if (io) {
    io.to(`workspace:${data.workspaceId}`).emit('project:created', project);
  }

  return project;
};

const getWorkspaceProjects = async (workspaceId) => {
  if (!workspaceId) return [];
  return projectRepo.findByWorkspace(workspaceId);
};

const getProjectById = async (projectId) => {
  const project = await projectRepo.findById(projectId);
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    err.errorCode = 'PROJECT_NOT_FOUND';
    throw err;
  }
  return project;
};

const updateProject = async (projectId, data) => {
  const project = await projectRepo.update(projectId, data);

  const io = getIO();
  if (io) {
    io.to(`project:${projectId}`).emit('project:updated', project);
  }

  return project;
};

const deleteProject = async (projectId) => {
  return projectRepo.remove(projectId);
};

const getProjectMembers = async (projectId) => {
  return projectRepo.findMembers(projectId);
};

const addProjectMember = async (projectId, userId, role = 'DEVELOPER') => {
  return projectRepo.addMember(projectId, userId, role);
};

const removeProjectMember = async (projectId, userId) => {
  return projectRepo.removeMember(projectId, userId);
};

module.exports = {
  createProject,
  getWorkspaceProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
};
