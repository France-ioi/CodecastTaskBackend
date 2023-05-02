import {Given, When} from '@cucumber/cucumber';
import {longPollingHandler} from '../../src/long_polling';
import {seedRandomIdGenerator} from '../support/hooks';

When(/^I wait (\d+)ms$/, async function (delay: number) {
  await new Promise(resolve => setTimeout(resolve, delay));
});

When(/^I fire the event "([^"]*)" to the longPolling handler$/, function (event: string) {
  longPollingHandler.fireEvent(event);
});

Given(/^I seed the ID generator to (\d+)$/, function (seed: number) {
  seedRandomIdGenerator(seed);
});
