import {After, DataTable, Given, Then} from '@cucumber/cucumber';
import * as Db from '../../src/db';
import {expect} from 'chai';

Given(/^the database has the following table "([^"]*)":$/, async function (table: string, dataTable: DataTable) {
  const [headers, ...rows] = dataTable.raw();

  const params: {[key: string]: unknown} = {};
  for (const [rowIndex, row] of rows.entries()) {
    for (const [cellIndex, value] of row.entries()) {
      params[`row${rowIndex}cell${cellIndex}`] = value;
    }
  }

  const query = `
        INSERT INTO \`${table}\`
            (${headers.join(', ')})
        VALUES
            ${rows.map((row, rowIndex) => `(${row.map((value, cellIndex) => (`:row${rowIndex}cell${cellIndex}`)).join(', ')})`).join(', ')}`;

  await Db.execute(query, params);
});

Then(/^the table "([^"]*)" should be:$/, async function (table: string, dataTable: DataTable) {
  const [headers, ...rows] = dataTable.raw();
  const objectRows = rows.map(row => {
    const object: {[header: string]: string} = {};
    for (let i = 0; i < row.length; i++) {
      object[headers[i]] = row[i];
    }

    return object;
  });

  const query = `SELECT * FROM ${table}`;
  const results = await Db.execute<{[key: string]: unknown}[]>(query);

  const resultRows = [];
  for (const result of results) {
    const resultRow: {[header: string]: string} = {};
    for (const [header, value] of Object.entries(result)) {
      const headerPosition = headers.indexOf(header);
      if (-1 === headerPosition) {
        continue;
      }
      resultRow[header] = String(value);
    }
    resultRows.push(resultRow);
  }

  expect(resultRows).to.deep.equal(objectRows);
});

// The blob columns hold a content that spans several lines, which cannot be written in the table of
// the step above, so they are only checked for being set or not
Then(/^the column "([^"]*)" of the table "([^"]*)" should be set on these rows only:$/, async function (column: string, table: string, dataTable: DataTable) {
  const expectedIds = dataTable.raw().slice(1).map(row => row[0]);

  const results = await Db.execute<{ID: string}[]>(`SELECT ID FROM ${table} WHERE ${column} IS NOT NULL`);

  expect(results.map(result => String(result.ID)).sort()).to.deep.equal(expectedIds.slice().sort());
});

// Makes the queries on a table fail like a database outage would, until the end of the scenario
const originalExecute = Db.execute;

Given(/^the queries on the table "([^"]*)" fail$/, function (table: string) {
  (Db as {execute: typeof Db.execute}).execute = async function <T>(query: string, params: string[] | Object = []): Promise<T> {
    if (query.includes(table)) {
      throw new Db.DatabaseError('Failed to execute MySQL query: simulated failure', query, new Error('Simulated failure'));
    }

    return await originalExecute<T>(query, params);
  };
});

After(function () {
  (Db as {execute: typeof Db.execute}).execute = originalExecute;
});
