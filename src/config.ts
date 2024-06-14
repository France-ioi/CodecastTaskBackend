import path from 'path';
import * as dotenv from 'dotenv';

let nodeEnv = String(process.env['NODE_ENV']);
if ('cucumber-js' === path.basename(process.argv[1])) {
  nodeEnv = 'test';
}

dotenv.config({path: path.resolve(__dirname, '../.env.' + ('test' === nodeEnv ? 'test' : 'local'))});
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
    debugPassword: string|undefined,
    url: string,
    ownName: string,
  },
  platform: {
    ownPrivateKey: string,
  },
  testMode: {
    enabled: boolean,
    platformName: string|undefined,
    userId: string|undefined,
    accessSolutions: boolean,
    nbHintsGiven: number,
  },
  codecastDebuggersUrl: string,
}

function stringifyIfExists(string: string|undefined): string|undefined {
  return string ? String(string) : undefined;
}

const appConfig: Config = {
  nodeEnv,
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
    debugPassword: stringifyIfExists(process.env.GRADER_QUEUE_DEBUG_PASSWORD),
    url: String(process.env.GRADER_QUEUE_URL),
    ownName: String(process.env.GRADER_QUEUE_OWN_NAME),
  },
  platform: {
    ownPrivateKey: String(process.env.PLATFORM_OWN_PRIVATE_KEY),
  },
  testMode: {
    enabled: '1' === String(process.env.TEST_MODE),
    platformName: stringifyIfExists(process.env.TEST_MODE_PLATFORM_NAME),
    userId: stringifyIfExists(process.env.TEST_MODE_USER_ID),
    accessSolutions: '1' === String(process.env.TEST_MODE_ACCESS_SOLUTIONS),
    nbHintsGiven: process.env.TEST_MODE_NB_HINTS_GIVEN ? Number(process.env.TEST_MODE_NB_HINTS_GIVEN) : 0,
  },
  codecastDebuggersUrl: String(process.env.CODECAST_DEBUGGERS_URL),
};

export default appConfig;
