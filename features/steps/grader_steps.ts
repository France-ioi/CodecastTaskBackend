import {Given, Then} from '@cucumber/cucumber';
import {QueueRequest, setQueueRequestSender} from '../../src/grader_interface';
import {expect} from 'chai';

interface GraderStepsContext {
  graderQueueRequest: QueueRequest,
}

Given(/^I mock the graderqueue$/, function (this: GraderStepsContext) {
  setQueueRequestSender((queueRequest: QueueRequest) => {
    this.graderQueueRequest = queueRequest;

    return Promise.resolve(JSON.stringify({
      errorcode: 0,
    }));
  });
});

Then(/^the grader queue should have received the following request:$/, function (this: GraderStepsContext, expectedJson: string) {
  const expectedRequest: unknown = JSON.parse(expectedJson);

  expect(this.graderQueueRequest).to.deep.equal(expectedRequest);
});
