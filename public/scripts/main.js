/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Endia Clark and Zeno Day
 */

/** namespace. */
var rhit = rhit || {};

/** globals */
rhit.variableName = "";

/** function and class syntax examples */
rhit.functionName = function () {
	/** function body */
};

rhit.ClassName = class {
	constructor() {

	}

	methodName() {

	}
}

rhit.LoginPageController = class {
	constructor() {

		document.querySelector("#indexBody").onclick = (event) => {
			document.querySelector("#indexBody").classList.add("bodyIntroAnimation");
			document.querySelector("#loginThe100").classList.add("textIntroAnimation")
			// document.querySelector("#firebaseui-auth-container").style.display = "block";
			// document.querySelector("#rosefireButton").style.display = "block";
			document.querySelector("#firebaseui-auth-container").style.opacity = "1";
			document.querySelector("#rosefireButton").style.opacity = "1";
		}

		// document.querySelector("#rosefireButton").onclick = (event) => {
		// 	rhit.fbAuthManager.signIn();
		// };
	}
}


rhit.startFirebaseUI = function() {
	var uiConfig = {
		signInSuccessUrl: '/bucket.html',
		signInOptions: [
		  firebase.auth.GoogleAuthProvider.PROVIDER_ID,
		  firebase.auth.EmailAuthProvider.PROVIDER_ID,
		  firebase.auth.PhoneAuthProvider.PROVIDER_ID,
		  firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
		],
	  };

	  const ui = new firebaseui.auth.AuthUI(firebase.auth());
	  ui.start('#firebaseui-auth-container', uiConfig);
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	new rhit.LoginPageController();
	rhit.startFirebaseUI();
};

rhit.main();
