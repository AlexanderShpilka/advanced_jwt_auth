const bcrypt = require('bcrypt');
const uuid = require('uuid');
const UserModel = require('../models/user-model');
const mailService = require('./mail-service');
const tokenService = require('./token-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');

class UserService {
  async registration(email, password) {
    // 1. Check if user with this email already exists. If so - throw an error.
    const candidate = await UserModel.findOne({ email });
    if (candidate) {
      throw ApiError.BadRequest(`User with email ${email} already exists.`);
    }

    // 2. Create hash password and activation link.
    const hashPassword = await bcrypt.hash(password, 3);
    const activationLink = uuid.v4(); // cdb63720-9628-5ef6-bbca-2e5ce6094f3c

    // 3. Save a user to the DB.
    const user = await UserModel.create({ email, password: hashPassword, activationLink });

    // 4. Send activation link to the registration email.
    await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);

    // 5. Create user dto.
    const userDto = new UserDto(user); // { id, email, isActivated }

    // 6. Generate access and refresh tokens and save refresh token to the DB.
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return { ...tokens, user: userDto }; // { accessToken, refreshToken, user: { id, email, isActivated } }
  }

  async activate(activationLink) {
     const user = await UserModel.findOne({ activationLink });
     if (!user) {
       throw ApiError.BadRequest('Activation link is not correct');
     }

     user.isActivated = true;
     await user.save();
  }

  async login(email, password) {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw ApiError.BadRequest(`User is not found.`);
    }

    const isPassEquals = await bcrypt.compare(password, user.password);
    if (!isPassEquals) {
      throw ApiError.BadRequest(`Incorrect password.`);
    }

    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return { ...tokens, user: userDto };
  }

  async logout(refreshToken) {
    return await tokenService.removeToken(refreshToken);
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }

    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken);
    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError();
    }

    const user = await UserModel.findById(userData.id);
    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return { ...tokens, user: userDto };
  }

  async getAllUsers() {
    return UserModel.find();
  }
}

module.exports = new UserService();
