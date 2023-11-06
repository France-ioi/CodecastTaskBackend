import {decode} from './util';
import {pipe} from 'fp-ts/function';
import * as D from 'io-ts/Decoder';

export const remoteExecutionClientDecoder = pipe(
  D.struct({
    messageId: D.number,
    message: D.struct({
      action: D.string,
    }),
  }),
);
export type RemoteExecutionClientPayload = D.TypeOf<typeof remoteExecutionClientDecoder>;

export interface RemoteExecuterServerPayload {
  messageId: number,
  message: {
    success: boolean,
    snapshot?: unknown,
    error?: {
      type: string,
      message?: string,
    },
  },
}

export async function remoteExecutionProxyHandler(clientPayload: unknown): Promise<RemoteExecuterServerPayload> {
  const clientPayloadData: RemoteExecutionClientPayload = decode(remoteExecutionClientDecoder)(clientPayload);

  //console.log('receive message', clientPayloadData);
  const snapshots = await require('../example_snapshots.json') as unknown[];

  const messageId = clientPayloadData.messageId;
  const action = clientPayloadData.message.action;

  if ('start' === action) {
    const snapshot = snapshots[messageId];

    return {
      messageId,
      message: {
        success: true,
        snapshot,
      },
    };
  } else if ('into' === action) {
    const snapshot = snapshots[messageId];

    return {
      messageId,
      message: {
        success: true,
        snapshot,
      },
    };
  } else {
    return {
      messageId,
      message: {
        success: false,
        error: {
          type: 'unknown_action',
        },
      },
    };
  }
}
