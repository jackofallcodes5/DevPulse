const userRepo = require('../repositories/user.repository');
const workspaceRepo = require('../repositories/workspace.repository');
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { hashPassword, comparePassword } = require('../utils/crypto');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { exchangeCodeForToken, getGitHubUser } = require('../integrations/github');
const githubRepo = require('../repositories/github.repository');

const ensureDefaultWorkspace = async (userId, name, username) => {
  try {
    const workspaces = await workspaceRepo.findByUserId(userId);
    if (workspaces.length === 0) {
      const slug = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}-workspace-${Math.floor(Math.random() * 1000)}`;
      await workspaceRepo.create({
        name: `${name}'s Workspace`,
        slug,
        ownerId: userId,
      });
    }
  } catch (err) {
    console.error('Failed to ensure default workspace:', err);
  }
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth/refresh',
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
};

const register = async ({ name, username, email, password }) => {
  const existingEmail = await userRepo.findByEmail(email);
  if (existingEmail) {
    const err = new Error('Email is already registered');
    err.statusCode = 409;
    err.errorCode = 'EMAIL_EXISTS';
    throw err;
  }

  const existingUsername = await userRepo.findByUsername(username);
  if (existingUsername) {
    const err = new Error('Username is already taken');
    err.statusCode = 409;
    err.errorCode = 'USERNAME_TAKEN';
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;

  const user = await userRepo.create({
    name,
    username,
    email,
    passwordHash,
    avatarUrl,
  });

  await ensureDefaultWorkspace(user.id, user.name, user.username);

  const payload = { id: user.id, email: user.email, username: user.username };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.execute(
    'INSERT INTO refresh_tokens (id, token, user_id, expires_at) VALUES (?, ?, ?, ?)',
    [uuidv4(), refreshToken, user.id, expiresAt]
  );

  return { user, accessToken, refreshToken };
};

const login = async ({ email, password }) => {
  const userWithPassword = await userRepo.findByEmail(email);
  if (!userWithPassword || !userWithPassword.passwordHash) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    err.errorCode = 'INVALID_CREDENTIALS';
    throw err;
  }

  const isValid = await comparePassword(password, userWithPassword.passwordHash);
  if (!isValid) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    err.errorCode = 'INVALID_CREDENTIALS';
    throw err;
  }

  const user = await userRepo.findById(userWithPassword.id);

  await ensureDefaultWorkspace(user.id, user.name, user.username);

  const payload = { id: user.id, email: user.email, username: user.username };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.execute(
    'INSERT INTO refresh_tokens (id, token, user_id, expires_at) VALUES (?, ?, ?, ?)',
    [uuidv4(), refreshToken, user.id, expiresAt]
  );

  return { user, accessToken, refreshToken };
};

const refresh = async (oldRefreshToken) => {
  if (!oldRefreshToken) {
    const err = new Error('Refresh token required');
    err.statusCode = 401;
    err.errorCode = 'REFRESH_TOKEN_REQUIRED';
    throw err;
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(oldRefreshToken);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    err.errorCode = 'INVALID_REFRESH_TOKEN';
    throw err;
  }

  const [rows] = await pool.execute('SELECT * FROM refresh_tokens WHERE token = ?', [oldRefreshToken]);
  const storedToken = rows[0];

  if (!storedToken || storedToken.revoked || new Date(storedToken.expires_at) < new Date()) {
    const err = new Error('Refresh token revoked or expired');
    err.statusCode = 401;
    err.errorCode = 'REFRESH_TOKEN_INVALID';
    throw err;
  }

  // Refresh token rotation: revoke old token
  await pool.execute('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?', [storedToken.id]);

  const user = await userRepo.findById(decoded.id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    err.errorCode = 'USER_NOT_FOUND';
    throw err;
  }

  const payload = { id: user.id, email: user.email, username: user.username };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.execute(
    'INSERT INTO refresh_tokens (id, token, user_id, expires_at) VALUES (?, ?, ?, ?)',
    [uuidv4(), newRefreshToken, user.id, expiresAt]
  );

  return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (refreshToken) => {
  if (refreshToken) {
    await pool.execute('UPDATE refresh_tokens SET revoked = 1 WHERE token = ?', [refreshToken]);
  }
};

const githubOAuthCallback = async (code, currentUserId = null) => {
  const tokenData = await exchangeCodeForToken(code);
  if (!tokenData.access_token) {
    const err = new Error('GitHub OAuth failed');
    err.statusCode = 400;
    err.errorCode = 'GITHUB_OAUTH_FAILED';
    throw err;
  }

  const githubUser = await getGitHubUser(tokenData.access_token);
  let user;

  if (currentUserId) {
    user = await userRepo.findById(currentUserId);
  } else {
    const existingGithubAcc = await githubRepo.findAccountByGithubId(String(githubUser.id));
    if (existingGithubAcc) {
      user = await userRepo.findById(existingGithubAcc.userId);
    } else {
      const userByEmail = githubUser.email
        ? await userRepo.findByEmail(githubUser.email)
        : null;

      if (userByEmail) {
        user = userByEmail;
      } else {
        const username = (githubUser.login + '_' + Math.floor(Math.random() * 1000)).slice(0, 30);
        user = await userRepo.create({
          name: githubUser.name || githubUser.login,
          username,
          email: githubUser.email || `${githubUser.login}@users.noreply.github.com`,
          avatarUrl: githubUser.avatar_url,
        });
      }
    }
  }

  await ensureDefaultWorkspace(user.id, user.name, user.username);

  await githubRepo.upsertAccount(user.id, {
    githubId: githubUser.id,
    login: githubUser.login,
    name: githubUser.name,
    avatarUrl: githubUser.avatar_url,
    accessToken: tokenData.access_token,
    tokenScope: tokenData.scope,
  });

  const payload = { id: user.id, email: user.email, username: user.username };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.execute(
    'INSERT INTO refresh_tokens (id, token, user_id, expires_at) VALUES (?, ?, ?, ?)',
    [uuidv4(), refreshToken, user.id, expiresAt]
  );

  return { user, accessToken, refreshToken };
};

module.exports = {
  setAuthCookies,
  clearAuthCookies,
  register,
  login,
  refresh,
  logout,
  githubOAuthCallback,
};
