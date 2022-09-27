import {Platform} from './models';

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
    idUser: process.env.TEST_MODE_USER_ID ? process.env.TEST_MODE_USER_ID : null,
    bSubmissionPossible: true,
    idTaskLocal: taskId,
    itemUrl: process.env.BASE_URL ? process.env.BASE_URL + '?taskId=' + taskId : null,
    bAccessSolutions: Boolean(process.env.TEST_MODE_ACCESS_SOLUTIONS),
    nbHintsGiven: Number(process.env.TEST_MODE_NB_HINTS_GIVEN),
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

    throw 'Reading token is not implemented yet';
  } catch (e) {
    if (process.env.TEST_MODE) {
      return getTestTokenParameters(askedTaskId);
    } else {
      throw e;
    }
  }
}

