
export abstract class RemoteLib {
  public abstract executeRemoteCall(callName: string, args: any[]): Promise<unknown>;
}
