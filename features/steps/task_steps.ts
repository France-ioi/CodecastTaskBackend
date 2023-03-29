import {Then, When} from '@cucumber/cucumber';
import path from 'path';
import {expect} from 'chai';
import {readFile} from 'fs/promises';
import {ServerInjectResponse} from '@hapi/hapi';
import {testServer} from '../support/hooks';

interface TaskStepsContext {
    response: ServerInjectResponse,
}

When(/^I send a (GET|POST) request to "([^"]*)"$/, async function (this: TaskStepsContext, method: string, url: string) {
    this.response = await testServer.inject({
        method,
        url,
    });
});

Then(/^the response body should be: "([^"]*)"$/, async function (this: TaskStepsContext, fileName: string) {
    const expectedResponse = JSON.parse(await readFile(path.join(__dirname, '..', fileName), "utf8"));
    const payload = JSON.parse(this.response.payload);
    console.log(payload);
    expect(payload).to.deep.equal(expectedResponse);
});

Then(/^the response status code should be (\d+)$/, async function (this: TaskStepsContext, errorCode) {
    expect(this.response.statusCode).to.equal(errorCode);
});
