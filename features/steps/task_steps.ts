import {Then, When} from '@cucumber/cucumber';
import path from 'path';
import {expect} from 'chai';
import {readFile} from 'fs/promises';
import {ServerInjectResponse} from '@hapi/hapi';
import {testServer} from '../support/hooks';
import {longPollingHandler} from '../../src/long_polling';

interface TaskStepsContext {
  response: ServerInjectResponse,
  responsePromise: Promise<void>,
}

When(/^I send a (GET|POST) request to "([^"]*)"$/, async function (this: TaskStepsContext, method: string, url: string) {
  this.response = await testServer.inject({
    method,
    url,
  });
});

When(/^I asynchronously send a (GET|POST) request to "([^"]*)"$/, function (this: TaskStepsContext, method: string, url: string) {
  this.responsePromise = testServer.inject({
    method,
    url,
  })
    .then((response: ServerInjectResponse): void => {
      this.response = response;
    });
});

Then(/^the response status code should be (\d+)$/, function (this: TaskStepsContext, errorCode) {
  expect(this.response.statusCode).to.equal(errorCode);
});

Then(/^the response body should be the content of this file: "([^"]*)"$/, async function (this: TaskStepsContext, fileName: string) {
  const expectedResponse: unknown = JSON.parse(await readFile(path.join(__dirname, '..', fileName), 'utf8'));
  const payload: unknown = JSON.parse(this.response.payload);
  expect(payload).to.deep.equal(expectedResponse);
});

Then(/^the response body should be the following JSON:$/, function (this: TaskStepsContext, expectedJson: string) {
  const expectedResponse: unknown = JSON.parse(expectedJson);
  const payload: unknown = JSON.parse(this.response.payload);
  expect(payload).to.deep.equal(expectedResponse);
});

When(/^I fire the event "([^"]*)" to the longPolling handler$/, function (this: TaskStepsContext, event: string) {
  longPollingHandler.fireEvent(event);
});

When(/^I wait until next tick$/, async function () {
  await new Promise(resolve => setTimeout(resolve));
});

Then(/^the server must have returned a response$/, function (this: TaskStepsContext) {
  expect(this.response).to.not.be.undefined;
});

Then(/^the server must not have returned a response$/, function () {
  expect(this.response).to.be.undefined;
});
