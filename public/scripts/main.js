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
rhit.fbAuthManager = null;


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



rhit.HomePageController = class {
	constructor() {
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#submitSong").addEventListener("click", (event)=> {
			const ranking = document.querySelector("#inputRanking").value;
			const rating = document.querySelector("#inputRating").value;
			console.log("Ranking: "+ ranking + " Rating: "+ rating);
		});
	}

	
}

rhit.LoginPageController = class {
	constructor() {
		// document.querySelector("#rosefireButton").disabled = true;
		document.querySelector("#indexBody").onclick = (event) => {
			document.querySelector("#indexBody").classList.add("bodyIntroAnimation");
			document.querySelector("#loginThe100").classList.add("textIntroAnimation")
			// document.querySelector("#firebaseui-auth-container").style.display = "block";
			// document.querySelector("#rosefireButton").style.display = "block";
			document.querySelector("#firebaseui-auth-container").style.opacity = "1";
			document.querySelector("#rosefireButton").style.opacity = "1";
			// document.querySelector("#rosefireButton").disabled = false;
		}

		document.querySelector("#rosefireButton").onclick = (event) => {
			rhit.fbAuthManager.signIn();
		};
	}
}

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
		console.log("You have made theAuth Manager");
	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}
	signIn() {
		console.log("TODO: Sign in usingrosefire");
		Rosefire.signIn("c6cce2ff-fbdc-4be8-a1b1-fea0cbb86a96", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);

			firebase.auth().signInWithCustomToken(rfUser.token).catch((error)=>{
				const errorCode = error.code;
				const errorMessage = error.message;
				if(errorCode === 'auth/invalid-custom-token') {
					alert('The token you provided is not valid.');
				}else{
					console.error("Custom auth error", errorCode, errorMessage);
				}
			});
		});


	}
	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("Sign out error");
		});

	}
	get isSignedIn() {
		// return this._user != null;
		//casts truthy or falsy value into true or false
		return !!this._user;
	}
	get uid() {
		return this._user.uid;
	}
}


rhit.checkForRedirects = function() {
	if (document.querySelector("#logInPage") && rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/home.html"
	}
	if (!document.querySelector("#logInPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/"
	}
};

rhit.initializePage = function() {
	const urlParams = new URLSearchParams(window.location.search);

	if (document.querySelector("#homePage")) {
		console.log("You are on the home page.");
		new rhit.HomePageController();
		// const uid = urlParams.get("uid");
		// rhit.fbPictureManager = new rhit.FbPicturesManager(uid);
		// new rhit.ListPageController();

	}

	if (document.querySelector("#dataPage")) {
		console.log("You are on the data page.");
		// const picId = urlParams.get("id");
		// if (!picId) {
		// 	window.location.href = "/";
		// }
		// rhit.fbSinglePictureManager = new rhit.FbSinglePictureManager(picId);
		// new rhit.DetailPageController();

	}

	if (document.querySelector("#profilePage")) {
		console.log("You are on the profile page.");

	}

	if (document.querySelector("#settingsPage")) {
		console.log("You are on the settings page.");

	}

	if (document.querySelector("#logInPage")) {
		console.log("You are on the logIn page.");
		new rhit.LoginPageController();
		// new rhit.LoginPageController();
		
	}
};


rhit.startFirebaseUI = function() {
	var uiConfig = {
		signInSuccessUrl: '/home.html',
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
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("authchange callback fired.")
		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);
		
		//Check for redirects
		rhit.checkForRedirects();
		//Page initialization
		rhit.initializePage();
	});
	rhit.startFirebaseUI();
};

rhit.main();
