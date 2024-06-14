import {Platform} from './db_models';
import * as jose from 'jose';
import {KeyLike} from 'jose/dist/types/types';
import moment from 'moment';
import {JwesDecoder} from './crypto/jwes_decoder';
import {InvalidInputError} from './error_handler';
import * as Db from './db';

export interface PlatformGenericTokenPayload {
  idUser: string|null,
  itemUrl: string|null,
  nbHintsGiven: number,
  idItem?: string,
  platformName?: string,
  type?: string,
  secret?: string,
  idAttempt?: string,
  idItemLocal?: string,
}

export interface PlatformTaskTokenPayload extends PlatformGenericTokenPayload {
  bSubmissionPossible?: boolean,
  bAllowGrading?: boolean,
  bAccessSolutions: boolean,
}

export interface PlatformAnswerTokenPayload extends PlatformGenericTokenPayload {
  idUserAnswer?: string,
  sAnswer?: string,
}

export async function decodePlatformTaskToken<T extends PlatformGenericTokenPayload>(token: string|null|undefined, platform: Platform): Promise<T> {
  const jwesDecoder = new JwesDecoder();
  await jwesDecoder.setKeys(platform.public_key);
  const tokenParams = await jwesDecoder.checkJwsSignature(token!) as T;
  if ('long' === tokenParams?.type) {
    await checkLongToken(tokenParams, platform);
  }

  return tokenParams;
}

async function checkLongToken(params: PlatformGenericTokenPayload, platform: Platform): Promise<void> {
  const remoteSecret = await Db.querySingleScalarResult<string>(
    'SELECT sRemoteSecret from tm_remote_secret WHERE idUser = ? and idPlatform = ?',
    [params.idUser, platform.ID]
  );
  if (!remoteSecret) {
    throw new InvalidInputError(`Cannot find secret for user ${String(params.idUser)} and platform ${platform.ID}`);
  }
  if (remoteSecret !== params.secret) {
    throw new InvalidInputError(`Remote secret does not match for user ${String(params.idUser)} and platform ${platform.ID}`);
  }
}

/**
 * JWE key is the recipient public key used for encryption
 * JWS Key is our private key used for signing
 */
export class TokenGenerator {
  public jwsKey: KeyLike|null = null;
  public jweKey: KeyLike|null = null;
  public algorithm = 'ES256';

  // Own private key to sign for JWS, recipient public key to encrypt for JWE
  public async setKeys(jwsKey: string, jweKey: string|undefined = undefined): Promise<void> {
    await this.setJwsKey(jwsKey);

    if (jweKey) {
      await this.setJweKey(jweKey);
    }
  }

  public async setJwsKey(jwsKey: string): Promise<void> {
    if (!jwsKey) {
      throw new Error('A valid JWS key and a valid JWE key must be fulfilled');
    }

    this.jwsKey = await jose.importPKCS8(jwsKey, this.algorithm);
  }

  public async setJweKey(jweKey: string): Promise<void> {
    this.jweKey = await jose.importSPKI(jweKey, this.algorithm);
  }

  async encodeJwes(payload: {[key: string]: any}): Promise<string> {
    const jwsPayload = await this.jwsSignPayload(payload);

    return await this.encodeJwe(jwsPayload);
  }

  async jwsSignPayload(payload: {[key: string]: any}): Promise<string> {
    if (null === this.jwsKey) {
      throw new Error('JWS key must be fulfilled to do encryption');
    }

    payload['date'] = moment().format('DD-MM-YYYY');

    const jws = await new jose.CompactSign(
      new TextEncoder().encode(JSON.stringify(payload)),
    )
      .setProtectedHeader({alg: 'RS512'})
      .sign(this.jwsKey);

    // console.log(jws);

    return jws;
  }

  async encodeJwe(payload: string): Promise<string> {
    if (null === this.jweKey) {
      throw new Error('JWE key must be fulfilled to do encryption');
    }

    const jwe = await new jose.CompactEncrypt(
      new TextEncoder().encode(payload),
    )
      .setProtectedHeader({alg: 'RSA-OAEP-256', enc: 'A256CBC-HS512', zip: 'DEF'})
      .encrypt(this.jweKey);

    // console.log(jwe);

    return jwe;
  }
}
