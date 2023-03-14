export enum LongPollingHandlerResult {
  Event = 'event',
  Timeout = 'timeout',
}

class LongPollingHandler {
  private listeners: {[eventName: string]: Function} = {};

  waitForEvent(eventName: string, timeout: number): Promise<LongPollingHandlerResult> {
    return new Promise(resolve => {
      this.register(eventName, resolve);

      setTimeout(() => {
        resolve(LongPollingHandlerResult.Timeout);
      }, timeout);
    });
  }

  fireEvent(eventName: string): void {
    if (!(eventName in this.listeners)) {
      return;
    }

    const listener = this.listeners[eventName];
    this.unregister(eventName);
    listener(LongPollingHandlerResult.Event);
  }

  register(eventName: string, listener: Function): void {
    this.listeners[eventName] = listener;
  }

  unregister(eventName: string): void {
    delete this.listeners[eventName];
  }
}

export const longPollingHandler = new LongPollingHandler();
