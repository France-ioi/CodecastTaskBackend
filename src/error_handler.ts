import Hapi, {ResponseValue} from '@hapi/hapi';
import {Boom} from '@hapi/boom';
import {DatabaseError} from './db';
import appConfig from './config';
import {HTTPError} from 'got';

export class NotFoundError extends Error {
}

export class InvalidInputError extends Error {
}

export class PlatformInteractionError extends Error {
}

export function isResponseBoom(response: any): response is Boom {
  return (response as Boom).isBoom && (response as Boom).isServer;
}

export class ErrorHandler {
  public handleError(e: any, h: Hapi.ResponseToolkit): ResponseValue {
    if (e instanceof InvalidInputError) {
      return h
        .response({error: 'Incorrect input arguments.', message: String(e)})
        .code(400);
    }

    if (e instanceof DatabaseError) {
      if (e.query) {
        // eslint-disable-next-line
        console.error(e.query, e.error);
      } else {
        // eslint-disable-next-line
        console.error(e);
      }

      return h
        .response({error: 'A database error has occurred.', ...(appConfig.testMode.enabled ? {details: String(e), query: e.query, databaseError: e.error} : {})})
        .code(500);
    }

    if (e instanceof NotFoundError) {
      return h
        .response({error: 'Not found', ...(appConfig.testMode.enabled ? {details: String(e)} : {})})
        .code(404);
    }

    if (e instanceof HTTPError) {
      const url = e.request.requestUrl;
      const error = e.response.body as string;
      let parsedError: unknown = error;
      try {
        parsedError = JSON.parse(error);
      } catch (e) {
        // eslint-disable-next-line
        console.error({error: e});
      }

      // eslint-disable-next-line
      console.error({url, error});

      return h
        .response({error: 'Error during external API call', ...(appConfig.testMode.enabled ? {url, details: parsedError} : {})})
        .code(500);
    }

    // eslint-disable-next-line
    console.error(e);

    return h
      .response({error: 'An internal server error occurred', ...(appConfig.testMode.enabled ? {details: String(e)} : {})})
      .code(500);
  }
}
