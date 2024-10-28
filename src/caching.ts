export class CachePool {
  private cache: Record<string, {expires: Date, value: any}> = {};

  public async get(key: string, expires: number, getter: () => any)  {
    if (!(key in this.cache) || this.cache[key].expires < new Date()) {
      const expiredDate = new Date();
      expiredDate.setSeconds(expiredDate.getSeconds() + expires);

      this.cache[key] = {
        expires: expiredDate,
        value: await getter(),
      };
    }

    return this.cache[key];
  }
}
