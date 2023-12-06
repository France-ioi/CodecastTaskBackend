import {Server} from '@hapi/hapi';
import {AfterAll, Before, BeforeAll} from '@cucumber/cucumber';
import * as Db from '../../src/db';
import {init} from '../../src/server';

import chai from 'chai';
import chaiSubset from 'chai-subset';
import {setRandomIdGenerator} from '../../src/util';
import {closeOpenServers} from '../steps/server_steps';
import appConfig from '../../src/config';
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
  'tm_platforms',
  'tm_source_codes',
];

let currentId = 1;

export function seedRandomIdGenerator(seed: number): void {
  currentId = seed;
}

function randomIdGenerator(): string {
  return String(currentId++);
}

BeforeAll(async function () {
  Db.init();
  setRandomIdGenerator(randomIdGenerator);
  testServer = await init();
});

Before(async function () {
  await cleanDatabase();
});

AfterAll(async function () {
  await testServer.stop({timeout: 0});
  await Db.closePool();
  closeOpenServers();
});

async function cleanDatabase(): Promise<void> {
  if (!appConfig.testMode.enabled) {
    throw new Error('Database cannot be cleaned while not in test environment.');
  }

  for (const table of tablesToClear) {
    await Db.execute(`DELETE FROM ${table} WHERE 1`, {});
  }
}

export {
  testServer,
};
