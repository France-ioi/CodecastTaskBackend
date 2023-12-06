import {Platform} from './db_models';
import * as jose from 'jose';
import {KeyLike} from 'jose/dist/types/types';
import moment from 'moment';
import appConfig from './config';

export interface PlatformTokenParameters {
    idUser: string|null,
    bSubmissionPossible?: boolean,
    bAllowGrading?: boolean,
    idTaskLocal: string,
    itemUrl: string|null,
    bAccessSolutions: boolean,
    nbHintsGiven: number,
    idPlatform?: string,
    idItem?: string,
    idUserAnswer?: string,
    sAnswer?: string,
    returnUrl?: string,
}

function getTestTokenParameters(taskId: string): PlatformTokenParameters {
  return {
    idUser: appConfig.testMode.userId ? appConfig.testMode.userId : null,
    bSubmissionPossible: true,
    idTaskLocal: taskId,
    itemUrl: appConfig.baseUrl ? appConfig.baseUrl + '?taskId=' + taskId : null,
    bAccessSolutions: appConfig.testMode.accessSolutions,
    nbHintsGiven: appConfig.testMode.nbHintsGiven,
  };
}

// eslint-disable-next-line
export function decodePlatformToken(token: string|null|undefined, platformKey: string, keyName: string, askedTaskId: string, platform: Platform): PlatformTokenParameters {
  // const JWKS = jose.createLocalJWKSet({
  //     keys: [
  //         {
  //             kty: 'RSA',
  //             e: 'AQAB',
  //             n: '12oBZRhCiZFJLcPg59LkZZ9mdhSMTKAQZYq32k_ti5SBB6jerkh-WzOMAO664r_qyLkqHUSp3u5SbXtseZEpN3XPWGKSxjsy-1JyEFTdLSYe6f9gfrmxkUF_7DTpq0gn6rntP05g2-wFW50YO7mosfdslfrTJYWHFhJALabAeYirYD7-9kqq9ebfFMF4sRRELbv9oi36As6Q9B3Qb5_C1rAzqfao_PCsf9EPsTZsVVVkA5qoIAr47lo1ipfiBPxUCCNSdvkmDTYgvvRm6ZoMjFbvOtgyts55fXKdMWv7I9HMD5HwE9uW839PWA514qhbcIsXEYSFMPMV6fnlsiZvQQ',
  //             alg: 'PS256',
  //         },
  //         {
  //             crv: 'P-256',
  //             kty: 'EC',
  //             x: 'ySK38C1jBdLwDsNWKzzBHqKYEE5Cgv-qjWvorUXk9fw',
  //             y: '_LeQBw07cf5t57Iavn4j-BqJsAD1dpoz8gokd3sBsOo',
  //             alg: 'ES256',
  //         },
  //     ],
  // })

  // const { payload, protectedHeader } = await jose.jwtVerify(token, JWKS, {
  //     issuer: 'urn:example:issuer',
  //     audience: 'urn:example:audience',
  // })
  // console.log(protectedHeader)
  // console.log(payload)

  try {
    // TODO: implement token parsing
    //     $params = $tokenParser->decodeJWS($sToken);
    //     if (isset($params['type']) && $params['type'] == 'long') {
    //         checkLongToken($params, $sPlatform['ID']);
    //     }

    throw new Error('Reading token is not implemented yet');
  } catch (e) {
    if (appConfig.testMode.enabled) {
      return getTestTokenParameters(askedTaskId);
    } else {
      throw e;
    }
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
  public async setKeys(jwsKey: string|undefined, jweKey: string|undefined): Promise<void> {
    if (!jwsKey || !jweKey) {
      throw new Error('A valid JWS key and a valid JWE key must be fulfilled');
    }
    // console.log({jwsKey, jweKey});

    this.jwsKey = await jose.importPKCS8(jwsKey, this.algorithm);
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
