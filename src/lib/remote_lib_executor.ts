import {OpenCvLib} from './opencv';
import {RemoteLib} from './remote_lib';
import {decode} from '../util';
import {pipe} from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

const availableLibraries: {[libraryName: string]: RemoteLib} = {
  opencv: new OpenCvLib(),
};

export const remoteCallPayloadDecoder = pipe(
  D.struct({
    libraryName: D.string,
    callName: D.string,
    args: D.UnknownArray,
  }),
);

export async function executeRemoteCall(libraryName: string, callName: string, args: unknown[]): Promise<unknown> {
  if (!(libraryName in availableLibraries)) {
    throw new Error(`Unknown remote lib name: ${libraryName}`);
  }

  return await availableLibraries[libraryName].executeRemoteCall(callName, args);
}

export async function decodeAndExecuteRemoteCall(remoteCallPayload: unknown): Promise<{success: boolean, result?: unknown, error?: string}> {
  const taskGraderWebhookParams = decode(remoteCallPayloadDecoder)(remoteCallPayload);

  try {
    const result = await executeRemoteCall(
      taskGraderWebhookParams.libraryName,
      taskGraderWebhookParams.callName,
      taskGraderWebhookParams.args
    );

    return {
      success: true,
      result,
    };
  } catch (e) {
    return {
      success: false,
      error: String(e),
    };
  }
}
