import {createPool, Pool} from 'mysql2';

let pool: Pool|null;

/**
 * generates pool connection to be used throughout the app
 */
export const init: () => void = () => {
  try {
    pool = createPool({
      host: process.env.MYSQL_DB_HOST,
      port: Number(process.env.MYSQL_DB_PORT),
      user: process.env.MYSQL_DB_USER,
      password: process.env.MYSQL_DB_PASSWORD,
      database: process.env.MYSQL_DB_DATABASE,
      charset: 'utf8',
      namedPlaceholders: true,
    });

    // TODO: set timezone

    // console.debug('MySql Adapter Pool generated successfully');
  } catch (error) {
    // console.error('[mysql.connector][init][Error]: ', error);
    throw new Error('failed to initialized pool');
  }
};

export const execute = <T>(query: string, params: string[] | Object): Promise<T> => {
  try {
    if (null === pool) throw new Error('Pool was not created. Ensure pool is created when running the app.');

    return new Promise<T>((resolve, reject) => {
      pool!.query(query, params, (error, results) => {
        if (error) reject(error);
        else resolve(results as unknown as T);
      });
    });

  } catch (error) {
    // console.error('[mysql.connector][execute][Error]: ', error);
    throw new Error('failed to execute MySQL query');
  }
};