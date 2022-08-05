'use strict';

import Hapi from "@hapi/hapi";
import { Server } from "@hapi/hapi";
import {getTask} from "./tasks";

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
                console.log('arrive here', request.params.taskId);
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

    // Routes will go here

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