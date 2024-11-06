import {Given, When} from '@cucumber/cucumber';
import {longPollingHandler} from '../../src/long_polling';
import {seedRandomIdGenerator} from '../support/hooks';
import {TokenGenerator} from '../../src/tokenization';
import appConfig from '../../src/config';

When(/^I wait (\d+)ms$/, async function (delay: number) {
  await new Promise(resolve => setTimeout(resolve, delay));
});

When(/^I fire the event "([^"]*)" to the longPolling handler$/, function (event: string) {
  longPollingHandler.fireEvent(event);
});

Given(/^I seed the ID generator to (\d+)$/, function (seed: number) {
  seedRandomIdGenerator(seed);
});
Given(/^"([^"]*)" is a token signed by the platform with the following payload:$/, async function (this, tokenName: string, payload: string) {
  const tokenGenerator = new TokenGenerator();
  await tokenGenerator.setKeys(appConfig.platform.ownPrivateKey);
  const parsedPayload = JSON.parse(payload) as Record<string, unknown>;
  this[tokenName] = await tokenGenerator.jwsSignPayload(parsedPayload);
});
