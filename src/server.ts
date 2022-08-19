'use strict';

import Hapi from "@hapi/hapi";
import { Server } from "@hapi/hapi";
import {getTask} from "./tasks";
import {createSubmission, SubmissionParameters} from "./submissions";

export let server: Server;

export const init = async function(): Promise<Server> {
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
                try {
                    const taskData = await getTask(request.params.taskId);

                    return h.response(taskData);
                } catch (e) {
                    console.error(e);
                    return h.response({error: "Not found"}).code(404);
                }
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/submissions',
        options: {
            handler: async (request, h) => {
                console.log('post new submission', request.payload);
                try {
                    const submissionId = await createSubmission(request.payload as SubmissionParameters);
                    console.log('submision result', submissionId);

                    return h.response({
                        success: true,
                        submissionId,
                    });
                } catch (e) {
                    console.error(e);
                    return h.response({error: "Impossible to process"}).code(500);
                }
            }
        }
    });

    return server;
};

export const start = async function (): Promise<void> {
    console.log(`Listening on ${server.settings.host}:${server.settings.port}`);
    return server.start();
};

process.on('unhandledRejection', (err) => {
    console.error(err);
    process.exit(1);
});