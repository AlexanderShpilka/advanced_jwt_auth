module.exports = class UserDto {
  email;
  id;
  isActivated;

  constructor(model) {
    this.email = model.email;
    this.id = model._id; // Mongo adds "_" to id
    this.isActivated = model.isActivated;
  }
}
