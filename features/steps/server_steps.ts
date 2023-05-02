import {Then, When} from '@cucumber/cucumber';
import path from 'path';
import {expect} from 'chai';
import {readFile} from 'fs/promises';
import {ServerInjectResponse} from '@hapi/hapi';
import {testServer} from '../support/hooks';

interface ServerStepsContext {
  response: ServerInjectResponse,
  responsePromise: Promise<ServerInjectResponse>,
}

When(/^I send a GET request to "([^"]*)"$/, async function (this: ServerStepsContext, url: string) {
  this.response = await testServer.inject({
    method: 'GET',
    url,
  });
});

When(/^I asynchronously send a GET request to "([^"]*)"$/, function (this: ServerStepsContext, url: string) {
  this.responsePromise = testServer.inject({
    method: 'GET',
    url,
  })
    .then((response: ServerInjectResponse): ServerInjectResponse => {
      this.response = response;

      return response;
    });
});

When(/^I send a POST request to "([^"]*)" with the following payload:$/, async function (this: ServerStepsContext, url: string, payload: string) {
  this.response = await testServer.inject({
    method: 'POST',
    url,
    payload,
  });
});

Then(/^the response status code should be (\d+)$/, function (this: ServerStepsContext, errorCode) {
  if (this.response.statusCode !== errorCode) {
    // eslint-disable-next-line
    console.log(JSON.parse(this.response.payload));
  }
  expect(this.response.statusCode).to.equal(errorCode);
});

Then(/^the response body should be the content of this file: "([^"]*)"$/, async function (this: ServerStepsContext, fileName: string) {
  const expectedResponse: unknown = JSON.parse(await readFile(path.join(__dirname, '..', fileName), 'utf8'));
  const payload: unknown = JSON.parse(this.response.payload);
  expect(payload).to.deep.equal(expectedResponse);
});

Then(/^the response body should be the following JSON:$/, function (this: ServerStepsContext, expectedJson: string) {
  const expectedResponse: unknown = JSON.parse(expectedJson);
  const payload: unknown = JSON.parse(this.response.payload);
  expect(payload).to.deep.equal(expectedResponse);
});

Then(/^the server must have returned a response within (\d+)ms$/, async function (this: ServerStepsContext, delay: number) {
  const result = await Promise.race([
    this.responsePromise,
    new Promise(resolve => setTimeout(resolve, delay)),
  ]);

  expect(result).to.not.be.undefined;
});

Then(/^the server must not have returned a response$/, function () {
  expect(this.response).to.be.undefined;
});
