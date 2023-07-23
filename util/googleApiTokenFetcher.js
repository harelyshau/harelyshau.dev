/* This file is required to create a JWT based on Google Service Account Creds.
Please don't create this token in the frontend part as you see here
because it is very dangerous to share sensitive data with an attacker.
I only use this approach because I don't have any sensitive information here.
You can see how to get Google Service Account Credentials from this link
https://developers.google.com/identity/protocols/oauth2/service-account */

sap.ui.define([], () => {
	'use strict';

	function loadJSEncrypt() {
		const scriptJSEncrypt = document.createElement('script');
		scriptJSEncrypt.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsencrypt/3.3.2/jsencrypt.min.js';
		document.head.appendChild(scriptJSEncrypt);
	}

	function loadCryptoJS() {
		const scriptCryptoJS = document.createElement('script');
		scriptCryptoJS.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
		document.head.appendChild(scriptCryptoJS);
	}

	loadCryptoJS();
	loadJSEncrypt();

	return {
		async getToken(oCredentials) {
			const { private_key, client_email, scopes } = oCredentials;
			if (!private_key || !client_email || !scopes) {
				throw new Error(
					"No required values. Please set 'private_key', 'client_email' and 'scopes'"
				);
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
			if (oCredentials.userEmail) {
				oClaim.sub = oCredentials.userEmail;
			}
			const oHeader = { alg: 'RS256', typ: 'JWT' };
			const sSignature = btoa(JSON.stringify(oHeader)) + '.' + btoa(JSON.stringify(oClaim));
			const oEncrypt = new JSEncrypt();
			oEncrypt.setPrivateKey(private_key);
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
	};
});
