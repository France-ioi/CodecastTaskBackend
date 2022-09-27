import * as D from 'io-ts/Decoder';
import {pipe} from 'fp-ts/function';
import {fold} from 'fp-ts/Either';

export class DecodingError extends Error {
}

function randomIntFromInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function getRandomId(): string {
  let rand = String(randomIntFromInterval(100000, 999999999));
  rand += String(randomIntFromInterval(1000000, 999999999));

  return rand;
}

export function decode<T>(decoder: D.Decoder<unknown, T>) {
  return (input: unknown): T => pipe(decoder.decode(input), fold(
    error => {
      throw new DecodingError(D.draw(error));
    },
    decoded => decoded,
  ));
}
