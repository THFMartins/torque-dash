"use strict";

// Carrega as variáveis de ambiente
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const db = {};

// Inicializa o Sequelize usando DATABASE_URL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  logging: false, // Defina como console.log para ver os logs SQL
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Necessário para conexões SSL no Heroku
    },
  },
});

// Carrega todos os modelos
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && // Ignora arquivos ocultos
      file !== basename && // Ignora este arquivo (index.js)
      file.slice(-3) === ".js" // Considera apenas arquivos .js
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

// Cria associações entre os modelos, se existirem
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Exporta a instância do Sequelize e os modelos
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
