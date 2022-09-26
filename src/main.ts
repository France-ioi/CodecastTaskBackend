import {init, start} from './server';
import path from 'path';
import * as dotenv from 'dotenv';
import * as Db from './db';

dotenv.config({path: path.resolve(__dirname, '../.env.local')});
dotenv.config({path: path.resolve(__dirname, '../.env')});

Db.init();

init();
start();