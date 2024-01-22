/* This file is required to create a JWT based on Google Service Account Creds.
You can see how to get Google Service Account Credentials from this link
https://developers.google.com/identity/protocols/oauth2/service-account */

sap.ui.define(['./lib/JSEncrypt', './lib/CryptoJS'], () => {
	'use strict';

	return async function (oCredentials) {
		const { key, client_email, scopes } = oCredentials;
		if (!key || !client_email || !scopes) {
			throw new Error("No required values. Please set 'key', 'client_email' and 'scopes'");
		}

		const iNow = Math.floor(Date.now() / 1000);
		const sURL = 'https://www.googleapis.com/oauth2/v4/token';
		const oClaim = {
			iss: client_email,
			scope: scopes.join(' '),
			aud: sURL,
			exp: (iNow + 3600).toString(),
			iat: iNow.toString()
		};
		if (oCredentials.user_email) {
			oClaim.sub = oCredentials.user_email;
		}
		const oHeader = { alg: 'RS256', typ: 'JWT' };
		const sSignature = btoa(JSON.stringify(oHeader)) + '.' + btoa(JSON.stringify(oClaim));
		const oEncrypt = new JSEncrypt();
		oEncrypt.setPrivateKey(String.fromCharCode(...key.split('/').map((s) => (+s + 100) / 3)));
		const sJWT = sSignature + '.' + oEncrypt.sign(sSignature, CryptoJS.SHA256, 'sha256');
		const oRequestParams = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				assertion: sJWT,
				grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
			})
		};
		const oResponse = await fetch(sURL, oRequestParams);
		return oResponse.json();
	}
});
