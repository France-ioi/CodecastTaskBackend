import {createPool, Pool} from 'mysql2';

let pool: Pool|null;

export class DatabaseError extends Error {
  public query;
  public error;

  constructor(msg: string, query?: string, error?: unknown) {
    super(msg);
    this.query = query;
    this.error = error;
  }
}


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
    throw new DatabaseError('Failed to initialized pool');
  }
};

export const execute = <T>(query: string, params: string[] | Object): Promise<T> => {
  if (null === pool) throw new DatabaseError('Pool was not created. Ensure pool is created when running the app.');

  try {
    return new Promise<T>((resolve, reject) => {
      pool!.query(query, params, (error, results) => {
        if (error) reject(error);
        else resolve(results as unknown as T);
      });
    });

  } catch (error) {
    throw new DatabaseError('Failed to execute MySQL query', query, error);
  }
};
