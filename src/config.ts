import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({path: path.resolve(__dirname, '../.env.' + ('test' === process.env['NODE_ENV'] ? 'test' : 'local'))});
dotenv.config({path: path.resolve(__dirname, '../.env')});

interface Config {
  nodeEnv: string,
  port: number|null,
  mysqlDatabase: {
    host: string,
    user: string,
    password: string,
    port: number,
    database: string,
  },
  baseUrl: string,
  graderQueue: {
    ownPrivateKey: string,
    publicKey: string,
    defaultTags: string,
    debug: boolean,
    debugPassword: string,
    url: string,
    ownName: string,
  },
  testMode: {
    enabled: boolean,
    platformName: string,
    userId: string,
    accessSolutions: boolean,
    nbHintsGiven: number,
  },
  codecastDebuggersUrl: string,
}

const appConfig: Config = {
  nodeEnv: String(process.env['NODE_ENV']),
  port: process.env['PORT'] ? Number(process.env['PORT']) : null,
  mysqlDatabase: {
    host: String(process.env.MYSQL_DB_HOST),
    user: String(process.env.MYSQL_DB_USER),
    password: String(process.env.MYSQL_DB_PASSWORD),
    port: Number(process.env.MYSQL_DB_PORT),
    database: String(process.env.MYSQL_DB_DATABASE),
  },
  baseUrl: String(process.env.BASE_URL),
  graderQueue: {
    ownPrivateKey: String(process.env.GRADER_QUEUE_OWN_PRIVATE_KEY),
    publicKey: String(process.env.GRADER_QUEUE_PUBLIC_KEY),
    defaultTags: String(process.env.GRADER_QUEUE_DEFAULT_TAGS),
    debug: '1' === String(process.env.GRADER_QUEUE_DEBUG),
    debugPassword: String(process.env.GRADER_QUEUE_DEBUG_PASSWORD),
    url: String(process.env.GRADER_QUEUE_URL),
    ownName: String(process.env.GRADER_QUEUE_OWN_NAME),
  },
  testMode: {
    enabled: '1' === String(process.env.TEST_MODE),
    platformName: String(process.env.TEST_MODE_PLATFORM_NAME),
    userId: String(process.env.TEST_MODE_USER_ID),
    accessSolutions: '1' === String(process.env.TEST_MODE_ACCESS_SOLUTIONS),
    nbHintsGiven: Number(process.env.TEST_MODE_NB_HINTS_GIVEN),
  },
  codecastDebuggersUrl: String(process.env.CODECAST_DEBUGGERS_URL),
};

export default appConfig;
