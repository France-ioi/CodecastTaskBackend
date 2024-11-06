
export abstract class RemoteLib {
  public abstract executeRemoteCall(callName: string, args: unknown[]): Promise<unknown>;
}
