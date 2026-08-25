const authService = require('../services/auth.service');
const userRepo = require('../repositories/user.repository');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const config = require('../config/env');

const register = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    authService.setAuthCookies(res, accessToken, refreshToken);
    return successResponse(res, { user }, 201, 'Registration successful');
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    authService.setAuthCookies(res, accessToken, refreshToken);
    return successResponse(res, { user }, 200, 'Login successful');
  } catch (err) {
    return next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token || req.body.refreshToken;
    const { user, accessToken, refreshToken: newRefreshToken } = await authService.refresh(refreshToken);
    authService.setAuthCookies(res, accessToken, newRefreshToken);
    return successResponse(res, { user }, 200, 'Token refreshed successfully');
  } catch (err) {
    return next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token || req.body.refreshToken;
    await authService.logout(refreshToken);
    authService.clearAuthCookies(res);
    return successResponse(res, null, 200, 'Logged out successfully');
  } catch (err) {
    return next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 'User not found', 404, 'USER_NOT_FOUND');
    }
    return successResponse(res, { user });
  } catch (err) {
    return next(err);
  }
};

const githubOAuthRedirect = (req, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${config.github.clientId}&redirect_uri=${encodeURIComponent(config.github.callbackUrl)}&scope=repo,user:email`;
  return res.redirect(url);
};

const githubCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      return errorResponse(res, 'Authorization code missing', 400, 'MISSING_CODE');
    }

    const { accessToken, refreshToken } = await authService.githubOAuthCallback(
      code,
      req.user?.id
    );

    authService.setAuthCookies(res, accessToken, refreshToken);
    return res.redirect(`${config.cors.origin}/dashboard`);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  githubOAuthRedirect,
  githubCallback,
};
