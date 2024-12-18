import Hapi, {Lifecycle} from '@hapi/hapi';
import {Server} from '@hapi/hapi';
import {getTask} from './tasks';
import {
  createOfflineSubmission,
  createSubmission,
  getSubmission, offlineSubmissionDataDecoder, OfflineSubmissionParameters,
  submissionDataDecoder,
  SubmissionParameters
} from './submissions';
import ReturnValue = Lifecycle.ReturnValue;
import {ErrorHandler, isResponseBoom, NotFoundError} from './error_handler';
import {receiveSubmissionResultsFromTaskGrader} from './grader_webhook';
import {longPollingHandler} from './long_polling';
import log from 'loglevel';
import HAPIWebSocket from 'hapi-plugin-websocket';
import Inert from '@hapi/inert';
import {remoteExecutionProxyHandler} from './remote_execution_proxy';
import appConfig from './config';
import {decode} from './util';
import {decodeAndExecuteRemoteCall} from './lib/remote_lib_executor';
import {addGitRoutes} from "./routes/git_routes";

export async function init(): Promise<Server> {
  const server = Hapi.server({
    port: appConfig.port || 4000,
    host: '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
      }
    },
  });

  await server.register(HAPIWebSocket);
  await server.register(Inert);

  server.route({
    method: 'GET',
    path: '/tasks/{taskId}',
    options: {
      handler: async (request, h) => {
        const taskData = await getTask(String(request.params.taskId));
        if (null === taskData) {
          throw new NotFoundError(`Task not found with this id: ${String(request.params.taskId)}`);
        }

        return h.response(taskData);
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/submissions',
    options: {
      handler: async (request, h) => {
        const submissionData: SubmissionParameters = decode(submissionDataDecoder)(request.payload);

        const submissionId = await createSubmission(submissionData);

        return h.response({
          success: true,
          submissionId,
        });
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/submissions-offline',
    options: {
      handler: async (request, h) => {
        const submissionData: OfflineSubmissionParameters = decode(offlineSubmissionDataDecoder)(request.payload);

        const submissionId = await createOfflineSubmission(submissionData);

        return h.response({
          success: true,
          submissionId,
        });
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/task-grader-webhook',
    options: {
      handler: async (request, h) => {
        log.debug('Receive results from grader queue');
        await receiveSubmissionResultsFromTaskGrader(request.payload);

        return h.response({
          success: true,
        });
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/submissions/{submissionId}',
    options: {
      handler: async (request, h) => {
        let submissionData = await getSubmission(String(request.params.submissionId));
        if (null === submissionData) {
          throw new NotFoundError(`Submission not found with this id: ${String(request.params.submissionId)}`);
        }
        if (!('longPolling' in request.query) || submissionData.evaluated) {
          return h.response(submissionData);
        }

        const longPollingResult = await longPollingHandler.waitForEvent('evaluation-' + submissionData.id, 10 * 1000);
        if ('event' === longPollingResult) {
          // Re-fetch submission
          submissionData = await getSubmission(String(request.params.submissionId));
          if (null === submissionData) {
            throw new NotFoundError(`Submission not found with this id: ${String(request.params.submissionId)}`);
          }
        }

        return h.response(submissionData);
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/remote-execution',
    options: {
      plugins: {
        websocket: {
          only: true,
          autoping: 30 * 1000,
        },
      },
      handler: async request => await remoteExecutionProxyHandler(request.websocket().ws, request.websocket().ctx, request.payload)
    },
  });

  server.route({
    method: 'POST',
    path: '/remote-lib-call',
    options: {
      handler: async (request, h) => {
        const {success, result, error} = await decodeAndExecuteRemoteCall(request.payload);

        return h.response({
          success,
          ...(success ? {result} : {error}),
        });
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/image-cache/{param*}',
    handler: {
      directory: {
        path: 'cache'
      }
    }
  });

  addGitRoutes(server);

  const errorHandler = new ErrorHandler();

  server.ext('onPreResponse', (request, h): ReturnValue => {
    if (isResponseBoom(request.response)) {
      const formattedResponse = errorHandler.handleError(request.response, h);

      return h.response(formattedResponse);
    } else {
      return h.continue;
    }
  });

  return server;
}

export const start = function (server: Server): void {
  log.info(`Listening on ${String(server.settings.host)}:${String(server.settings.port)}`);

  void server.start();
};

process.on('unhandledRejection', err => {
  // eslint-disable-next-line
  console.error(err);
  process.exit(1);
});
