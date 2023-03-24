import Hapi, {Lifecycle} from '@hapi/hapi';
import {Server} from '@hapi/hapi';
import {getTask} from './tasks';
import {createSubmission} from './submissions';
import ReturnValue = Lifecycle.ReturnValue;
import {ErrorHandler, isResponseBoom, NotFoundError} from './error_handler';

export let server: Server;

export const init = function(): Server {
  server = Hapi.server({
    port: process.env.PORT || 4000,
    host: '0.0.0.0',
    routes: {
      cors: true,
    },
  });

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
        const submissionId = await createSubmission(request.payload);

        return h.response({
          success: true,
          submissionId,
        });
      }
    }
  });

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
};

export const start = function (): void {
  // eslint-disable-next-line
  console.log(`Listening on ${server.settings.host}:${server.settings.port}`);

  void server.start();
};

process.on('unhandledRejection', err => {
  // eslint-disable-next-line
  console.error(err);
  process.exit(1);
});
