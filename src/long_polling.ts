export enum LongPollingHandlerResult {
  Event = 'event',
  Timeout = 'timeout',
}

class LongPollingHandler {
  private listeners: {[eventName: string]: {fn: Function, timeoutId: NodeJS.Timeout}} = {};

  waitForEvent(eventName: string, timeout: number): Promise<LongPollingHandlerResult> {
    return new Promise(resolve => {
      const timeoutId = setTimeout(() => {
        resolve(LongPollingHandlerResult.Timeout);
      }, timeout);

      this.register(eventName, timeoutId, resolve);
    });
  }

  fireEvent(eventName: string): void {
    if (!(eventName in this.listeners)) {
      return;
    }

    const {fn} = this.listeners[eventName];
    this.unregister(eventName);
    fn(LongPollingHandlerResult.Event);
  }

  register(eventName: string, timeoutId: NodeJS.Timeout, listener: Function): void {
    this.listeners[eventName] = {fn: listener, timeoutId};
  }

  unregister(eventName: string): void {
    const {timeoutId} = this.listeners[eventName];
    clearTimeout(timeoutId);
    delete this.listeners[eventName];
  }
}

export const longPollingHandler = new LongPollingHandler();
