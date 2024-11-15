const Joi = require("joi");
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      shareId: {
        type: DataTypes.STRING,
        unique: true,
      },
      forwardUrls: {
        type: DataTypes.ARRAY(DataTypes.STRING),
      },
    },
    {
      hooks: {
        beforeCreate: hashPassword,
        beforeUpdate: hashPassword,
      },
    }
  );

  // create association
  User.associate = function (models) {
    User.hasMany(models.Session, {
      as: "Sessions",
      foreignKey: "userId",
      onDelete: "cascade",
    });
  };

  // Static method for user data validation
  User.validate = function (user) {
    const schema = Joi.object({
      email: Joi.string()
        .email()
        .required()
        .messages({ "string.email": "Please provide a valid email." }),
      password: Joi.string().min(8).required(),
      confirmPassword: Joi.any()
        .valid(Joi.ref("password"))
        .required()
        .messages({ "any.only": "Passwords do not match." }),
    });
    return schema.validate(user);
  };

  // Instance method for password comparison
  User.prototype.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  return User;
};

async function hashPassword(user, options) {
  if (!user.changed("password")) {
    return;
  }
  try {
    const SALT_FACTOR = 8;
    const salt = await bcrypt.genSalt(SALT_FACTOR);
    const hash = await bcrypt.hash(user.password, salt);
    user.setDataValue("password", hash);
  } catch (error) {
    throw error;
  }
}
