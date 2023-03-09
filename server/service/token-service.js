const jwt = require('jsonwebtoken');
const TokenModel = require('../models/token-model');

class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15s' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30s' });

    return { accessToken, refreshToken };
  }

  validateAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (e) {
      return null;
    }
  }

  validateRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (e) {
      return null;
    }
  }

  async saveToken(userId, refreshToken) {
    // 1. Check if for this user id refresh token already exists.
    const tokenData = await TokenModel.findOne({ user: userId });
    // 2. If so - update refresh token and save
    if (tokenData) {
      tokenData.refreshToken = refreshToken;
      return tokenData.save();
    }

    // 3. If there is no refresh token for this user id - create one
    return await TokenModel.create({ user: userId, refreshToken });
  }

  async removeToken(refreshToken) {
    return TokenModel.deleteOne({ refreshToken });
  }

  async findToken(refreshToken) {
    return TokenModel.findOne({ refreshToken });
  }
}

module.exports = new TokenService();
