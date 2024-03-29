import {DataTable, Given, Then} from '@cucumber/cucumber';
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
