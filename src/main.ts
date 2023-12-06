import {init, start} from './server';
import path from 'path';
import * as dotenv from 'dotenv';
import * as Db from './db';
import log from 'loglevel';

dotenv.config({path: path.resolve(__dirname, '../.env.local')});
dotenv.config({path: path.resolve(__dirname, '../.env')});

log.setLevel(process.env['NODE_ENV'] === 'development' ? 'trace' : 'info');

Db.init();

void (async (): Promise<void> => {
  const server = await init();
  start(server);
})();
