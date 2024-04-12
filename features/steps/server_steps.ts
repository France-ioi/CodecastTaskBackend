import {Given, Then, When} from '@cucumber/cucumber';
import path from 'path';
import {expect} from 'chai';
import {readFile} from 'fs/promises';
import {ServerInjectResponse} from '@hapi/hapi';
import {testServer} from '../support/hooks';
import * as ws from 'ws';
import {remoteExecutionProxyHandler} from '../../src/remote_execution_proxy';
import nock from 'nock';

interface ServerStepsContext {
  response: ServerInjectResponse,
  responsePromise: Promise<ServerInjectResponse>,
  [key: string]: any,
}

function injectVariables(context: {[key: string]: string}, payload: string): string {
  return payload.replace(/\{\{(\w+)}}/g, (replacement, contents: string) => context[contents]);
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
    payload: injectVariables(this, payload),
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

interface WebSocketData {
  port: number,
  wss: ws.WebSocketServer,
  activeConnections: ws.WebSocket[],
  ctx: Record<string, any>,
  lastMessages: any[],
}

const openServers: {[key: string]: WebSocketData} = {};
const activeConnections: {[serverName: string]: ws.WebSocket} = {};

export function closeOpenServers(): void {
  for (const server of Object.values(openServers)) {
    server.wss.close();
  }
  for (const activeConnection of Object.values(activeConnections)) {
    activeConnection.close();
  }
}

When(/^I connect to the "([^"]*)" WS server$/, async function (this: ServerStepsContext, serverName: string) {
  const newWebSocket = new ws.WebSocket(`ws://127.0.0.1:${openServers[serverName].port}`);

  await new Promise<void>(resolve => {
    const timer = setInterval(() => {
      if (newWebSocket.readyState === 1) {
        clearInterval(timer);
        resolve();
      }
    }, 10);
  });

  activeConnections[serverName] = newWebSocket;

  newWebSocket.onmessage = (webSocketMessage): void => {
    const jsonMessage: unknown = JSON.parse(webSocketMessage.data as string);
    openServers[serverName].lastMessages.push(jsonMessage);
  };
});

Given(/^I have a "([^"]*)" WS server on port (\d+)$/, function (this: ServerStepsContext, serverName: string, port: number) {
  const server: WebSocketData = {
    port,
    wss: new ws.WebSocketServer({port}),
    activeConnections: [],
    ctx: {},
    lastMessages: [],
  };

  openServers[serverName] = server;

  server.wss.on('connection', (ws: ws.WebSocket) => {
    server.activeConnections.push(ws);

    if ('debuggers-mock' === serverName) {
      activeConnections[serverName] = ws;
    }

    ws.onmessage = (webSocketMessage): void => {
      const jsonMessage: unknown = JSON.parse(webSocketMessage.data as string);
      if ('backend' === serverName) {
        void remoteExecutionProxyHandler(ws, server.ctx, jsonMessage);
      } else {
        openServers[serverName].lastMessages.push(jsonMessage);
      }
    };
  });
});

Then(/^the "([^"]*)" WS server should have received a new connection$/, function (this: ServerStepsContext, serverName: string) {
  expect(openServers[serverName].activeConnections).to.not.be.empty;
});

When(/^I send to the "([^"]*)" WS server the following JSON:$/, function (this: ServerStepsContext, serverName: string, jsonMessage: string) {
  activeConnections[serverName].send(jsonMessage);
});

Then(/^the "([^"]*)" WS server should have received the following JSON:$/, function (this: ServerStepsContext, serverName: string, expectedJson: string) {
  expect(openServers[serverName].lastMessages).to.not.be.empty;
  const expectedResponse: unknown = JSON.parse(expectedJson);
  const lastMessage: unknown = openServers[serverName].lastMessages.shift();
  expect(lastMessage).to.deep.equal(expectedResponse);
});

Given(/^I setup a mock API answering any POST request to "([^"]*)" with the following payload:$/, function (this: ServerStepsContext, endpoint: string, mockPayload: string) {
  nock('https://mockapi.com')
    .post(endpoint)
    .reply(200, JSON.parse(mockPayload) as Record<string, any>);
});