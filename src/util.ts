import * as D from 'io-ts/Decoder';
import {pipe} from 'fp-ts/function';
import {fold} from 'fp-ts/Either';
import {InvalidInputError} from './error_handler';

function randomIntFromInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function defaultRandomIdGenerator(): string {
  let rand = String(randomIntFromInterval(100000, 999999999));
  rand += String(randomIntFromInterval(1000000, 999999999));

  return rand;
}

let randomIdGenerator = defaultRandomIdGenerator;

export function getRandomId(): string {
  return randomIdGenerator();
}

export function setRandomIdGenerator(getRandomId: () => string): void {
  randomIdGenerator = getRandomId;
}

export function decode<T>(decoder: D.Decoder<unknown, T>) {
  return (input: unknown): T => pipe(decoder.decode(input), fold(
    error => {
      throw new InvalidInputError(D.draw(error));
    },
    decoded => decoded,
  ));
}

/**
 * Parses a payload that Hapi handed over as a raw string (e.g. a text/plain body sent by navigator.sendBeacon)
 * back to JSON. Other payloads have already been parsed by Hapi and are returned as is.
 */
export function parseJsonPayload(payload: unknown): unknown {
  if ('string' !== typeof payload) {
    return payload;
  }

  try {
    return JSON.parse(payload) as unknown;
  } catch (e) {
    throw new InvalidInputError(`Invalid JSON payload: ${String(e)}`);
  }
}
