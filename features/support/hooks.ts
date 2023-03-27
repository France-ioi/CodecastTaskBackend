import {Server} from '@hapi/hapi';
import {AfterAll, BeforeAll} from '@cucumber/cucumber';
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
];

BeforeAll(async function () {
    dotenv.config({path: path.resolve(__dirname, '../../.env.test')});
    dotenv.config({path: path.resolve(__dirname, '../../.env')});

    Db.init();
    await cleanDatabase();

    testServer = await init();
});

AfterAll(async function () {
    await testServer.stop();
});

async function cleanDatabase() {
    for (let table of tablesToClear) {
        await Db.execute(`DELETE FROM ${table} WHERE 1`, {});
    }
}

export {
    testServer,
};