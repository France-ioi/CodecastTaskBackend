import {init, start} from './server';
import * as Db from './db';
import log from 'loglevel';
import appConfig from './config';

log.setLevel(appConfig.nodeEnv === 'development' ? 'trace' : 'info');

Db.init();

void (async (): Promise<void> => {
  const server = await init();
  start(server);
})();
