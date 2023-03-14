import {KeyLike} from 'jose/dist/types/types';
import * as jose from 'jose';
import moment from 'moment/moment';

/**
 * JWE key is our private key used for decryption
 * JWS Key is the recipient public key, used for signature check
 */
export class JwesDecoder {
  public jwsKey: KeyLike|null = null;
  public jweKey: KeyLike|null = null;
  public algorithm = 'ES256';

  // Recipient public key to check signature for JWS, own private key to decrypt for JWE
  public async setKeys(jwsKey: string|undefined, jweKey: string|undefined): Promise<void> {
    if (!jwsKey || !jweKey) {
      throw new Error('A valid JWS key and a valid JWE key must be fulfilled');
    }
    // console.log({jwsKey, jweKey});

    this.jwsKey = await jose.importSPKI(jwsKey, this.algorithm);
    this.jweKey = await jose.importPKCS8(jweKey, this.algorithm);
  }

  async decodeJwes(payload: string): Promise<unknown> {
    const jwsPayload = await this.decodeJwe(payload);

    return await this.checkJwsSignature(jwsPayload);
  }

  async checkJwsSignature(payload: string): Promise<unknown> {
    if (null === this.jwsKey) {
      throw new Error('JWS key must be fulfilled to do decryption');
    }

    const {payload: validatedContent} = await jose.compactVerify(payload, this.jwsKey);

    const result = new TextDecoder().decode(validatedContent);
    let params: {date?: string, type?: string} = {};
    try {
      params = JSON.parse(result) as {date?: string, type?: string};
    } catch (e) {
      throw new Error('Token cannot be decrypted, please check your SSL keys');
    }

    if (!params['date']) {
      throw new Error(`Invalid Task token, unable to decrypt: ${result}`);
    }

    const yesterdayDate = moment().subtract(1, 'day').format('DD-MM-YYYY');
    const todayDate = moment().format('DD-MM-YYYY');
    const tomorrowDate = moment().add(1, 'day').format('DD-MM-YYYY');

    if ((!params['type'] || params['type'] !== 'long') && params['date'] !== yesterdayDate && params['date'] !== todayDate && params['date'] !== tomorrowDate) {
      throw new Error(`API token expired: ${params['date']}`);
    }

    return params;
  }

  async decodeJwe(payload: string): Promise<string> {
    if (null === this.jweKey) {
      throw new Error('JWE key must be fulfilled to do decryption');
    }

    const {plaintext} = await jose.compactDecrypt(payload, this.jweKey);

    return new TextDecoder().decode(plaintext);
  }
}
