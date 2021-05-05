const config = require('config');
const {promisify} =require('util');
const axios = require('axios');
const jsonwebtoken = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const NodeCache = require( "node-cache" );
const myCache = new NodeCache();

const cognitoPoolId = config.get('userPoolId');
if (!cognitoPoolId) {
  throw new Error('env var required for cognito pool');
}

const cognitoPoolregion =config.get('userPoolRegion');
if (!cognitoPoolregion) {
  throw new Error('env var required for cognito pool region');
}

const cognitoIssuer = `https://cognito-idp.${cognitoPoolregion}.amazonaws.com/${cognitoPoolId}`;

const getPublicKeys = async function(){
    if (myCache.has("public-token-data")) {
        return myCache.get("public-token-data");
    }


    let cacheKeys = new Map();
    const url = `${cognitoIssuer}/.well-known/jwks.json`;
    const publicKeys = await axios.default.get(url);
    publicKeys.data.keys.forEach(function(element){
        const pem = jwkToPem(element);
        cacheKeys.set(element.kid,{instance: element, pem});
    });
    
    myCache.set("public-token-data",cacheKeys);
    return cacheKeys;
};

const verifyPromised = promisify(jsonwebtoken.verify.bind(jsonwebtoken));

async function jwtVerify(request){
    
    try {
      const token = request.token;
      const tokenSections = (token || '').split('.');
      if (tokenSections.length < 2) {
        var error= {
            "message":"Requested token is invalid"
        }

        let result = {error:error, isValid: false};
        return result;
      }

      const headerJSON = Buffer.from(tokenSections[0], 'base64').toString('utf8');
      const header = JSON.parse(headerJSON);
      const keys = await getPublicKeys();

      const key = keys.get(header.kid);
      if (key === undefined) {
        var error= {
            "message":"Claim made for unknown kid"
        }
        let result = {error:error, isValid: false};
        return result;
      }

      const claim = await verifyPromised(token, key.pem);
      const currentSeconds = Math.floor( (new Date()).valueOf() / 1000);
      if (currentSeconds > claim.exp || currentSeconds < claim.auth_time) {
        var error= {
            "message":"Claim is expired or invalid"
        }
        let result = {error:error, isValid: false};
        return result;
      }

      if (claim.iss !== cognitoIssuer) {
        var error= {
            "message":"Claim issuer is invalid"
        }
        let result = {error:error, isValid: false};
        return result;
      }

      /*
      if (claim.token_use !== 'access') {
        var error= {
            "message":"Claim use is not access"
        }
        let result = {error:error, isValid: false};
        return result;
      }
      */

      result = {claim: claim,isValid: true};

    } catch (error) {
        if (!error.hasOwnProperty('message')){
            console.log("I am here");
            error.message='Unknow server error'
        }
        console.log(error);
        result = {error, isValid: false};
    }
    return result;
};

module.exports=jwtVerify;