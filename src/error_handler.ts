import Hapi, {ResponseValue} from '@hapi/hapi';
import {Boom} from '@hapi/boom';
import {DatabaseError} from './db';

export class NotFoundError extends Error {
}

export class InvalidInputError extends Error {
}

export function isResponseBoom(response: any): response is Boom {
  return (response as Boom).isBoom && (response as Boom).isServer;
}

export class ErrorHandler {
  public handleError(e: Error, h: Hapi.ResponseToolkit): ResponseValue {
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
        .response({error: 'A database error has occurred.', ...(process.env.TEST_MODE ? {details: String(e), query: e.query, databaseError: e.error} : {})})
        .code(500);
    }

    if (e instanceof NotFoundError) {
      return h
        .response({error: 'Not found', ...(process.env.TEST_MODE ? {details: String(e)} : {})})
        .code(404);
    }

    // eslint-disable-next-line
    console.error(e);

    return h
      .response({error: 'An internal server error occurred', ...(process.env.TEST_MODE ? {details: String(e)} : {})})
      .code(500);
  }
}
