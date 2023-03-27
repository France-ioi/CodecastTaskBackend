import {createPool, Pool, PoolConnection, RowDataPacket} from 'mysql2/promise';

let pool: Pool|null = null;

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
export function init(): void {
  try {
    pool = createPool({
      host: process.env.MYSQL_DB_HOST,
      port: Number(process.env.MYSQL_DB_PORT),
      user: process.env.MYSQL_DB_USER,
      password: process.env.MYSQL_DB_PASSWORD,
      database: process.env.MYSQL_DB_DATABASE,
      charset: 'utf8',
      namedPlaceholders: true,
      supportBigNumbers: true,
      bigNumberStrings: true,
    });

    // TODO: set timezone?
  } catch (error) {
    throw new DatabaseError('Failed to initialized pool', undefined, error);
  }
}

export async function execute<T>(query: string, params: string[] | Object): Promise<T> {
  if (null === pool) throw new DatabaseError('Pool was not created. Ensure pool is created when running the app.');

  try {
    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    return rows as unknown as T;
  } catch (error) {
    throw new DatabaseError(`Failed to execute MySQL query: ${error as string}`, query, error);
  }
}

export async function executeInConnection<T>(connection: PoolConnection, query: string, params: string[] | Object): Promise<T> {
  try {
    const [rows] = await connection.query<RowDataPacket[]>(query, params);

    return rows as unknown as T;
  } catch (error) {
    throw new DatabaseError(`Failed to execute MySQL query: ${error as string}`, query, error);
  }
}

export async function querySingleResult<T>(query: string, params: string[] | Object): Promise<T|null> {
  query = addLimitOne(query);
  const results = await execute<T[]>(query, params);

  return results.length ? results[0] : null;
}

export async function querySingleScalarResult<T>(query: string, params: string[] | Object): Promise<T|null> {
  const result = await querySingleResult<RowDataPacket>(query, params);

  return null !== result ? result[Object.keys(result)[0]] as T : null;
}

function addLimitOne(query: string): string {
  if (-1 !== query.indexOf('LIMIT')) {
    return query;
  }

  query = query.trim();
  if (query.slice(-1) === ';') {
    query = query.substring(0, query.length - 1);
  }

  return `${query} LIMIT 1`;
}

export async function transactional(callback: (connection: PoolConnection) => Promise<void>): Promise<void> {
  if (null === pool) throw new DatabaseError('Pool was not created. Ensure pool is created when running the app.');

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    await callback(connection);
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
