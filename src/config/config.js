const HOST_NAME = process.env.PGSQL_SERVICE_HOST;
const PORT = process.env.PGSQL_SERVICE_PORT;
const DATABASE = process.env.DB_NAME;
const USERNAME = process.env.DB_SERVICE_ACCOUNT_USERNAME;
const PASSWORD = process.env.DB_SERVICE_ACCOUNT_PASSWORD;
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const YT_TOKEN = process.env.YT_TOKEN;

var config = {};

config.token = TOKEN;
config.yt_Token = YT_TOKEN;

config.dbcn = {
    host: HOST_NAME, // server name or IP address;
    port: PORT,
    database: DATABASE,
    user: USERNAME,
    password: PASSWORD,
};

module.exports = config;