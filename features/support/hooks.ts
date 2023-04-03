import {Server} from '@hapi/hapi';
import {AfterAll, Before, BeforeAll} from '@cucumber/cucumber';
import * as dotenv from 'dotenv';
import path from 'path';
import * as Db from '../../src/db';
import {init} from '../../src/server';

import chai from 'chai';
import chaiSubset from 'chai-subset';
chai.use(chaiSubset);

let testServer: Server;

const tablesToClear = [
  'tm_tasks',
  'tm_tasks_limits',
  'tm_tasks_strings',
  'tm_tasks_subtasks',
  'tm_tasks_tests',
  'tm_submissions',
  'tm_submissions_subtasks',
  'tm_submissions_tests',
];

BeforeAll(function () {
  dotenv.config({path: path.resolve(__dirname, '../../.env.test')});
  dotenv.config({path: path.resolve(__dirname, '../../.env')});

  Db.init();
  testServer = init();
});

Before(async function () {
  await cleanDatabase();
});

AfterAll(async function () {
  await testServer.stop({timeout: 0});
  await Db.closePool();
});

async function cleanDatabase(): Promise<void> {
  if ('test' !== process.env['NODE_ENVIRONMENT']) {
    throw new Error('Database cannot be cleaned while not in test environment.');
  }

  for (const table of tablesToClear) {
    await Db.execute(`DELETE FROM ${table} WHERE 1`, {});
  }
}

export {
  testServer,
};
