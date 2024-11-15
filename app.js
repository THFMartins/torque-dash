// Carrega as variáveis de ambiente
require("dotenv").config();

// Importa módulos essenciais
const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const { sequelize } = require("./models"); // Importa a instância do Sequelize dos modelos
const exphbs = require("express-handlebars");
const flash = require("connect-flash");
const session = require("cookie-session");
const passport = require("passport");
require("./config/passport")(passport); // Configura o Passport

// Configura middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Adiciona suporte para JSON, se necessário
app.use(express.static(path.join(__dirname, "public")));

// Configura sessão
app.use(
  session({
    keys: [process.env.SESSION_KEY || "default_session_key"],
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
  })
);

// Configura mensagens flash e Passport
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Configura variáveis locais para uso nas views
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// Configura o motor de templates Handlebars
app.engine(
  "hbs",
  exphbs({
    defaultLayout: "main",
    extname: "hbs",
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "/views"));

// Define rotas
app.use("/", require("./routes/web.js"));
app.use("/api", require("./routes/api.js"));
// Middleware para rotas não encontradas (404)
app.use("*", require("./routes/404.js"));

// Captura exceções não tratadas
process.on("uncaughtException", (err) => {
  console.error("Exceção não tratada:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Rejeição não tratada:", promise, "Razão:", reason);
});

// Função assíncrona para inicialização
const startServer = async () => {
  try {
    console.log("Iniciando aplicação...");

    // Autentica a conexão com o banco de dados
    await sequelize.authenticate();
    console.log("Conexão com o banco de dados estabelecida com sucesso.");

    // Sincroniza os modelos
    await sequelize.sync();
    console.log("Sincronização dos modelos concluída.");

    // Inicia o servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Servidor ouvindo na porta ${PORT}`));
  } catch (err) {
    console.error("Erro ao iniciar a aplicação:", err);
    process.exit(1); // Encerra o processo em caso de erro
  }
};

// Inicia a aplicação
startServer();
