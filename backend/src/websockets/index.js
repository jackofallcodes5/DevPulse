const { Server } = require('socket.io');
const cookie = require('cookie');
const { verifyAccessToken } = require('../utils/jwt');
const config = require('../config/env');
const logger = require('../utils/logger');

let io = null;
const onlineUsers = new Map(); // userId -> Set of socketIds

const initializeSocketIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers.cookie) {
        const cookies = cookie.parse(socket.handshake.headers.cookie);
        token = cookies.access_token;
      }

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      return next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;

    // Track online presence
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join personal user room for direct notifications
    socket.join(`user:${userId}`);

    logger.debug(`Socket connected for user:${userId}`, { socketId: socket.id });

    // Join workspace room
    socket.on('join:workspace', (workspaceId) => {
      if (workspaceId) {
        socket.join(`workspace:${workspaceId}`);
        logger.debug(`Socket ${socket.id} joined workspace:${workspaceId}`);
      }
    });

    socket.on('leave:workspace', (workspaceId) => {
      if (workspaceId) {
        socket.leave(`workspace:${workspaceId}`);
      }
    });

    // Join project room
    socket.on('join:project', (projectId) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
        logger.debug(`Socket ${socket.id} joined project:${projectId}`);
      }
    });

    socket.on('leave:project', (projectId) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });

    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
        }
      }
      logger.debug(`Socket disconnected for user:${userId}`, { socketId: socket.id });
    });
  });

  return io;
};

const getIO = () => io;

const isUserOnline = (userId) => {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
};

module.exports = { initializeSocketIO, getIO, isUserOnline };
