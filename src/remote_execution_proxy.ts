import {decode} from './util';
import {pipe} from 'fp-ts/function';
import * as D from 'io-ts/Decoder';
import HAPIPluginWebsocket from 'hapi-plugin-websocket';
import * as ws from 'ws';
import log from 'loglevel';

export const remoteExecutionClientDecoder = pipe(
  D.struct({
    messageId: D.number,
    message: pipe(
      D.struct({
        action: D.string,
      }),
      D.intersect(D.partial({
        answer: D.struct({
          language: D.string,
          fileName: D.string,
          sourceCode: D.string,
          input: D.string,
        }),
      })),
    ),
  }),
);
export type RemoteExecutionClientPayload = D.TypeOf<typeof remoteExecutionClientDecoder>;

const handlerProxies: RemoteSocketProxyHandler[] = [];

class RemoteSocketProxyHandler {
  private serverWebSocket: ws.WebSocket;
  private clientWebSocket: ws.WebSocket;
  private proxyId: number|null = null;

  public constructor(websocket: ws.WebSocket) {
    this.clientWebSocket = websocket;
    // eslint-disable-next-line
    this.serverWebSocket = new ws.WebSocket(process.env.CODECAST_DEBUGGERS_URL as string);
    this.serverWebSocket.addEventListener('error', () => {
      log.debug('[Remote] Impossible to connect to server');
      this.clientWebSocket.send(JSON.stringify({
        action: 'close',
      }));
    });
    this.clientWebSocket.onclose = (): void => {
      this.close('client');
    };
  }

  public init(): Promise<void> {
    return new Promise<void>(resolve => {
      const timer = setInterval(() => {
        if (this.serverWebSocket.readyState === 1) {
          clearInterval(timer);

          this.serverWebSocket.onmessage = (webSocketMessage): void => {
            log.debug('[Remote] Server -> Client', JSON.parse(webSocketMessage.data as string));
            this.clientWebSocket.send(webSocketMessage.data);
          };

          this.serverWebSocket.onclose = (): void => {
            this.close('server');
          };

          resolve();
        }
      }, 10);
    });
  }

  public setProxyId(proxyId: number): void {
    this.proxyId = proxyId;
  }

  public handlePayload(clientPayloadData: RemoteExecutionClientPayload): void {
    log.debug('[Remote] Client -> Server', clientPayloadData);
    this.serverWebSocket.send(JSON.stringify(clientPayloadData));
  }

  public close(from: 'client'|'server'): void {
    if (null === this.proxyId) {
      return;
    }

    log.debug('[Remote] Connection closed');
    if ('client' === from) {
      this.serverWebSocket.send(JSON.stringify({action: 'close'}));
    } else if ('server' === from) {
      this.clientWebSocket.send(JSON.stringify({action: 'close'}));
    }
    this.clientWebSocket.close();
    this.serverWebSocket.close();
    delete handlerProxies[this.proxyId];
    this.proxyId = null;
  }
}

export async function remoteExecutionProxyHandler(websocket: HAPIPluginWebsocket.PluginState, clientPayload: unknown): Promise<null> {
  const clientPayloadData: RemoteExecutionClientPayload = decode(remoteExecutionClientDecoder)(clientPayload);

  if (undefined === websocket.ctx.proxyId) {
    // Establish proxy
    const newProxy = new RemoteSocketProxyHandler(websocket.ws);
    await newProxy.init();
    log.debug('[Remote] New connection, proxy established');
    handlerProxies.push(newProxy);
    websocket.ctx.proxyId = handlerProxies.length - 1;
    newProxy.setProxyId(websocket.ctx.proxyId as number);
  }

  const proxyHandler = handlerProxies[websocket.ctx.proxyId as number];
  proxyHandler.handlePayload(clientPayloadData);

  return null;
}
