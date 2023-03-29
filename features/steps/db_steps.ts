import {DataTable, Given} from '@cucumber/cucumber';
import * as Db from '../../src/db';

Given(/^the database has the following table "([^"]*)":$/, async function (table, dataTable: DataTable) {
    const [headers, ...rows] = dataTable.raw();

    const params: {[key: string]: unknown} = {};
    for (let [rowIndex, row] of rows.entries()) {
        for (let [cellIndex, value] of row.entries()) {
            params[`row${rowIndex}cell${cellIndex}`] = value;
        }
    }

    const query = `
        INSERT INTO \`${table}\`
            (${headers.join(', ')})
        VALUES
            ${rows.map((row, rowIndex) => {
        return `(${row.map((value, cellIndex) => (`:row${rowIndex}cell${cellIndex}`)).join(', ')})`;
    }).join(', ')}`;

    console.log({query, params})

    await Db.execute(query, params);
});
