/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Endia Clark and Zeno Day
 */

var rhit = rhit || {};
// import {arr} from "./data";

rhit.FB_COLLECTION_SONGS = "Songs";
rhit.FB_KEY_YTKEY = "YTKey";
rhit.FB_KEY_ARTIST = "Artist";
rhit.FB_KEY_TITLE = "Title";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_KEY_AUTHOR = "Author";
rhit.FB_KEY_USER_RANKING = "userRanking";
rhit.FB_KEY_USER_RATING = "userRating";
rhit.FB_KEY_GLOBAL_RANKING = "globalRanking";
rhit.fbSongManager = null;
rhit.fbSingleSongManager = null;
rhit.fbAuthManager = null;

//From: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

rhit.Song = class {
	constructor(id, key, artist, title, ranking, rating, global) {
		this.id = id;
		this.key = key;
		this.artist = artist;
		this.title = title;
		this.ranking = ranking;
		this.rating = rating;
		this.global = global;
	}
}

rhit.FbSongsManager = class {

	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_SONGS);
		this._unsubscribe = null;
	}

	add(key, artist, title, ranking, rating, global) {

		this._ref.add({
				[rhit.FB_KEY_YTKEY]: key,
				[rhit.FB_KEY_ARTIST]: artist,
				[rhit.FB_KEY_TITLE]: title,
				[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
				[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
				[rhit.FB_KEY_USER_RANKING]: ranking,
				[rhit.FB_KEY_USER_RATING]: rating,
				[rhit.FB_KEY_GLOBAL_RANKING]: global,
			})
			.then(function (docRef) {
				console.log("Document written with ID: ", docRef.id);
			})
			.catch(function (error) {
				console.log("Error adding document: ", error);
			});

	}

	beginListening(changeListener) {
		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50);
		if (this._uid) {
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		})
	}
	stopListening() {
		this._unsubscribe();
	}
	get length() {
		return this._documentSnapshots.length;
	}
	getSongAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const pic = new rhit.Song(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_YTKEY),
			docSnapshot.get(rhit.FB_KEY_ARTIST),
			docSnapshot.get(rhit.FB_KEY_TITLE),
			docSnapshot.get(rhit.FB_KEY_USER_RANKING),
			docSnapshot.get(rhit.FB_KEY_USER_RATING),
			docSnapshot.get(rhit.FB_KEY_GLOBAL_RANKING)
		);
		return pic;
	}
}

rhit.HomePageController = class {
	constructor() {
		this._randSong = Math.floor(Math.random() * 11);
		this._tempRating = 4;
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#submitSong").addEventListener("click", (event) => {
			// const movie = document.querySelector("#inputRanking").value;
			const ranking = (document.querySelector("#inputRanking")).value;
			if (ranking < 0 || ranking > 100) {
				document.querySelector("#rankingWarning").innerHTML = "Ranking not between 0 and 100!";
			} else {
				var rating = 0;
				document.querySelector("#rankingWarning").innerHTML = "";
				document.querySelectorAll(".star").forEach(star => {
					if (star.classList.contains("selected")) {
						star.classList.toggle("selected");
						rating++;
					}
				})
				console.log("Ranking: " + ranking);
				rhit.fbSongManager.add(data[this._randSong].key, data[this._randSong].artist, data[this._randSong].title, ranking, rating, this._randSong + 1);
				(document.querySelector("#inputRanking")).value = "";
				document.querySelector("#guessTitle").innerHTML = `${data[this._randSong].title} by ${data[this._randSong].artist}`
				document.querySelector("#guessResult").innerHTML = `Your Guess: ${ranking}\nTrue Ranking: ${this._randSong}`
				console.log(rhit.fbSongManager);
			}
		});
		document.querySelector("#newSong").addEventListener("click", (event) => {
			this._randSong = Math.floor(Math.random() * 11);
			this.updateView();
		});
		document.querySelectorAll(".star").forEach(star => {
			star.addEventListener("click", (event) => {
				star.classList.toggle("selected");
			})
		})
		// document.querySelector("#star1").addEventListener("click", (event) => {
		// 	document.querySelector("#star1").dataset.selected = 1;
		// })
		rhit.fbSongManager.beginListening(this.updateView.bind(this));
	}

	updateView() {
		// const randSong = Math.floor(Math.random()*11);
		const songURL = document.querySelector("#player");
		songURL.setAttribute("src", `https://www.youtube.com/embed/${data[this._randSong].key}?autoplay=1`);
		document.querySelector("#songTitle").innerHTML = `${data[this._randSong].title} by ${data[this._randSong].artist}`;
		// if (rhit.fbSinglePictureManager.author == rhit.fbAuthManager.uid) {
		// 	document.querySelector("#menuEdit").style.display = "flex";
		// 	document.querySelector("#menuDelete").style.display = "flex";
		// }
	}
}

rhit.DataPageController = class {
	constructor() {
		this.showUserData = true;

		document.querySelector("#userData").addEventListener("click", (event)=>{
			if(document.querySelector("#globalData").classList.contains("currentData")){
				document.querySelector("#globalData").classList.toggle("currentData");
				document.querySelector("#userData").classList.toggle("currentData");
			}
			this.showUserData = true;
			this.updateList();

		});
		document.querySelector("#globalData").addEventListener("click", (event)=>{
			if(document.querySelector("#userData").classList.contains("currentData")){
				document.querySelector("#userData").classList.toggle("currentData");
				document.querySelector("#globalData").classList.toggle("currentData");
			}
			this.showUserData = false;
			this.updateList();

		});
		//JS for data search
		document.querySelector("#searchButton").addEventListener("click", () => {
			alert(document.querySelector("#searchInput").value);
			//not yet finished
			// if(!(document.querySelector("#searchInput").value == "")) {
			// 	var /*input, */filter, ul, li, a, i, txtValue;
			// 	//input = document.getElementById('myInput');
			// 	filter = document.querySelector("#searchInput").value.toUpperCase();//input.value.toUpperCase();
			// 	ul = document.getElementById("myUL");
			// 	li = ul.getElementsByTagName('li');

			// 	// Loop through all list items, and hide those who don't match the search query
			// 	for (i = 0; i < li.length; i++) {
			// 		a = li[i].getElementsByTagName("a")[0];
			// 		txtValue = a.textContent || a.innerText;
			// 		if (txtValue.toUpperCase().indexOf(filter) > -1) {
			// 			li[i].style.display = "";
			// 		} else {
			// 			li[i].style.display = "none";
			// 		}
			// 	}
			// }
		});
		rhit.fbSongManager.beginListening(this.updateList.bind(this));

	}


	updateList() {
		console.log(this.showUserData);
		const newList = htmlToElement('<div id="songListContainer"></div>');
		if(this.showUserData == true){
			for (let i = 0; i < rhit.fbSongManager.length; i++) {
				const song = rhit.fbSongManager.getSongAtIndex(i);
				const newCard = this._createCard(song);
				newCard.onclick = (event) => {
					window.location.href = `/song.html?id=${song.id}`;
				};
				newList.appendChild(newCard);
			}
		} else{
			for(let i = 0; i< data.length; i++){
				const song = data[i];
				const newCard = this._createGlobalCard(song, i+1);
				newCard.onclick = (event) => {
					window.location.href = `/globalsong.html?id=${i}`;
				};
				newList.appendChild(newCard);
			}
		}

		const oldList = document.querySelector("#songListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;

		oldList.parentElement.appendChild(newList);
	}

	_createCard(song) {
		return htmlToElement(`
			<div class="card" id="card">
        	<div class="card-body">
          	<h5 class="card-text">${song.title} by ${song.artist}</h5>
          	<h6 class="card-subtitle mb-2">Your Ranking: ${song.ranking}</h6>
			<h6 class="card-subtitle mb-2">True Ranking: ${song.global}</h6>
			<h6 class="card-subtitle mb-2">User's Rating: ${song.rating}</h6>
        	</div>
      		</div>
				`);
	}

	_createGlobalCard(song, ranking) {
		return htmlToElement(`
			<div class="card" id="card">
        	<div class="card-body">
          	<h5 class="card-text">${song.title} by ${song.artist}</h5>
			<h6 class="card-subtitle mb-2">True Ranking: ${ranking}</h6>
        	</div>
      		</div>
				`);
	}
}

rhit.FbSingleSongManager = class {
	constructor(songId) {
	  this._documentSnapshot = {};
	  this._unsubscribe = null;
	  this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_SONGS).doc(songId);
	  console.log(`Listening to ${this._ref.path}`);
	}
	beginListening(changeListener) {
		this._unsubscribe =this._ref.onSnapshot((doc) => {
			if(doc.exists){
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				console.log("No such document!");
			}
		});
	}
	stopListening() {
	  this._unsubscribe();
	}
	update(ranking, rating) {
		this._ref.update({
			[rhit.FB_KEY_USER_RANKING]: ranking,
			[rhit.FB_KEY_USER_RATING]: rating,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now()
		})
		.then(() => {
			console.log("Document successfully updated!");
		})
		.catch(function (error) {
			console.eroor("Error adding document: ", error);
		});
	}
	delete() {
		return this._ref.delete();
	}

	get key() {
		return this._documentSnapshot.get(rhit.FB_KEY_YTKEY);
	}
	get title() {
		return this._documentSnapshot.get(rhit.FB_KEY_TITLE);
	}
	get artist() {
		return this._documentSnapshot.get(rhit.FB_KEY_ARTIST);
	}
	get global() {
		return this._documentSnapshot.get(rhit.FB_KEY_GLOBAL_RANKING);
	}
	get ranking() {
		return this._documentSnapshot.get(rhit.FB_KEY_USER_RANKING);
	}
	get rating() {
		return this._documentSnapshot.get(rhit.FB_KEY_USER_RATING);
	}
	get author() {
		return this._documentSnapshot.get(rhit.FB_KEY_AUTHOR);
	}
 }

rhit.DetailPageController = class {
	constructor() {

		document.querySelector("#submitEditSong").addEventListener("click", (event) => {
			const ranking = document.querySelector("#inputRanking").value;
			if (ranking < 0 || ranking > 100) {
				document.querySelector("#rankingWarning").innerHTML = "Ranking not between 0 and 100!";
			} else {
				var rating = 0;
				document.querySelector("#rankingWarning").innerHTML = "";
				document.querySelectorAll(".star").forEach(star => {
					if (star.classList.contains("selected")) {
						star.classList.toggle("selected");
						console.log("star hit");
						rating++;
					}
				})
			rhit.fbSingleSongManager.update(ranking, rating);
			}
		});
		document.querySelectorAll(".star").forEach(star => {
			star.addEventListener("click", (event) => {
				star.classList.toggle("selected");
			})
		});

		$("#editSongDialog").on("show.bs.modal", (event) => {
			//Pre animation
			document.querySelector("#inputRanking").value = rhit.fbSingleSongManager.ranking;
			var rating = rhit.fbSingleSongManager.rating;
			document.querySelectorAll(".star").forEach(star => {
				if (rating > 0) {
					star.classList.toggle("selected");
					rating--;
				}
			})
		});
		$("#editSongDialog").on("shown.bs.modal", (event) => {
			//Post animation
			document.querySelector("#inputRanking").focus();
		});

		document.querySelector("#submitDeleteSong").addEventListener("click", (event) => {
			rhit.fbSingleSongManager.delete().then(()=> {
				console.log("Document successfully deleted!");
				window.location.href = "data.html";
			}).catch((error)=>{
				console.error("Error removing document: ", error);
			});

		});

		rhit.fbSingleSongManager.beginListening(this.updateView.bind(this));
	}
	updateView() {
		const player = document.querySelector("#player");
		player.setAttribute("src", `https://www.youtube.com/embed/${rhit.fbSingleSongManager.key}?autoplay=1`);
		document.querySelector("#cardTitle").innerHTML = `${rhit.fbSingleSongManager.title} by ${rhit.fbSingleSongManager.artist}`;
		document.querySelector("#cardData").innerHTML = `Your Ranking: ${rhit.fbSingleSongManager.ranking}<br>True Ranking: ${rhit.fbSingleSongManager.global}<br>Your Rating: ${rhit.fbSingleSongManager.rating}<br>Author: ${rhit.fbSingleSongManager.author}`
		if(rhit.fbSingleSongManager.author == rhit.fbAuthManager.uid){
			document.querySelector("#dropdownMenuButton").style.display="flex";
			document.querySelector("#menuEdit").style.display="flex";
			document.querySelector("#menuDelete").style.display="flex";
		}
	}
}

rhit.GlobalDetailPageController = class {
	constructor(index) {
		this._index = index;

		document.querySelector("#submitAddSong").addEventListener("click", (event) => {
			const ranking = document.querySelector("#inputRanking").value;
			if (ranking < 0 || ranking > 100) {
				document.querySelector("#rankingWarning").innerHTML = "Ranking not between 0 and 100!";
			} else {
				var rating = 0;
				document.querySelector("#rankingWarning").innerHTML = "";
				document.querySelectorAll(".star").forEach(star => {
					if (star.classList.contains("selected")) {
						star.classList.toggle("selected");
						console.log("star hit");
						rating++;
					}
				})
				rhit.fbSongManager.add(data[index].key, data[index].artist, data[index].title, ranking, rating, index + 1);
			}
		});
		document.querySelectorAll(".star").forEach(star => {
			star.addEventListener("click", (event) => {
				star.classList.toggle("selected");
			})
		});

		$("#addSongDialog").on("show.bs.modal", (event) => {
			//Pre animation
			document.querySelector("#inputRanking").value = index;
		});
		$("#editSongDialog").on("shown.bs.modal", (event) => {
			//Post animation
			document.querySelector("#inputRanking").focus();
		});

		rhit.fbSongManager.beginListening(this.updateView.bind(this));
	}
	updateView() {
		const player = document.querySelector("#player");
		player.setAttribute("src", `https://www.youtube.com/embed/${data[this._index].key}?autoplay=1`);
		document.querySelector("#cardTitle").innerHTML = `${data[this._index].title} by ${data[this._index].artist}`;
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

			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === 'auth/invalid-custom-token') {
					alert('The token you provided is not valid.');
				} else {
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


rhit.checkForRedirects = function () {
	if (document.querySelector("#logInPage") && rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/home.html"
	}
	if (!document.querySelector("#logInPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/"
	}
};

rhit.initializePage = function () {
	const urlParams = new URLSearchParams(window.location.search);

	if (document.querySelector("#homePage")) {
		console.log("You are on the home page.");
		const uid = urlParams.get("uid");
		rhit.fbSongManager = new rhit.FbSongsManager(uid);
		new rhit.HomePageController();
		// new rhit.ListPageController();

	}

	if (document.querySelector("#dataPage")) {
		console.log("You are on the data page.");
		const uid = urlParams.get("uid");
		rhit.fbSongManager = new rhit.FbSongsManager(uid);
		new rhit.DataPageController();
		// const picId = urlParams.get("id");
		// if (!picId) {
		// 	window.location.href = "/";
		// }
		// rhit.fbSinglePictureManager = new rhit.FbSinglePictureManager(picId);
		// new rhit.DetailPageController();

	}

	if (document.querySelector("#songPage")) {
		console.log("You are on the song page.");
		const uid = urlParams.get("id");
		rhit.fbSingleSongManager = new rhit.FbSingleSongManager(uid);
		new rhit.DetailPageController();
	}

	if (document.querySelector("#globalSongPage")) {
		console.log("You are on the global song page.");
		const uid = urlParams.get("id");
		rhit.fbSongManager = new rhit.FbSongsManager;
		new rhit.GlobalDetailPageController(uid);
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


rhit.startFirebaseUI = function () {
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


// rhit.FB_COLLECTION_PICTURES = "Pictures";
// rhit.FB_KEY_URL = "url";
// rhit.FB_KEY_CAPTION = "caption";
// rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
// rhit.FB_KEY_AUTHOR = "author";
// rhit.fbPictureManager = null;
// rhit.fbSinglePictureManager = null;
// rhit.fbAuthManager = null;


// //From: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
// function htmlToElement(html) {
//     var template = document.createElement('template');
//     html = html.trim(); // Never return a text node of whitespace as the result
//     template.innerHTML = html;
//     return template.content.firstChild;
// }

// rhit.ListPageController = class {
// 	constructor() {

// 		document.querySelector("#menuShowAllPictures").addEventListener("click", (event) => {
// 			window.location.href = "/bucket.html";
// 		});
// 		document.querySelector("#menuShowMyPictures").addEventListener("click", (event) => {
// 			window.location.href = `/bucket.html?uid=${rhit.fbAuthManager.uid}`;
// 		});
// 		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
// 			rhit.fbAuthManager.signOut();
// 		});

// 		document.querySelector("#submitAddPhoto").addEventListener("click", (event) => {
// 			const url = document.querySelector("#inputURL").value;
// 			const caption = document.querySelector("#inputCaption").value;
// 			rhit.fbPictureManager.add(url, caption);

// 		});

// 		$("#addPhotoDialog").on("show.bs.modal", (event) => {
// 			//Pre animation
// 			const url = document.querySelector("#inputURL").value = "";
// 			const caption = document.querySelector("#inputCaption").value = "";
// 		});
// 		$("#addPhotoDialog").on("shown.bs.modal", (event) => {
// 			//Post animation
// 			const url = document.querySelector("#inputURL").focus();
// 		});

// 		//Start listening!
// 		rhit.fbPictureManager.beginListening(this.updateList.bind(this));

// 	}


// 	updateList() {
// 		const newList = htmlToElement('<div id="photoBucketColumns"></div>');
// 		for(let i = 0; i<rhit.fbPictureManager.length; i++) {
// 			const pic = rhit.fbPictureManager.getPictureAtIndex(i);
// 			const newCard = this._createCard(pic);
// 			newCard.onclick = (event) => {
// 				window.location.href = `/photo.html?id=${pic.id}`;
// 			};
// 			newList.appendChild(newCard);
// 		}

// 		const oldList = document.querySelector("#photoBucketColumns");
// 		oldList.removeAttribute("id");
// 		oldList.hidden = true;

// 		oldList.parentElement.appendChild(newList);
// 	}

// 	_createCard(pic) {
// 		return htmlToElement(`
// 		<div class="pin" id="${pic.id}">
// 		<img src="${pic.url}" class="img-fluid" alt="${pic.caption}">
// 		<p class="caption">${pic.caption}</p>
// 		</div>
// 		`);
// 	}

//    }

//    rhit.Picture = class {
// 	   constructor(id, url, caption) {
// 		   this.id = id;
// 		   this.url = url;
// 		   this.caption = caption;
// 	   }
//    }

//    rhit.FbPicturesManager = class {

// 	constructor(uid) {
// 		this._uid = uid;
// 	  this._documentSnapshots = [];
// 	  this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_PICTURES);
// 	  this._unsubscribe = null;
// 	}

// 	add(url, caption) { 

// 		this._ref.add({
// 			[rhit.FB_KEY_URL]: url,
// 			[rhit.FB_KEY_CAPTION]: caption,
// 			[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
// 			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now()
// 		})
// 		.then(function (docRef) {
// 			console.log("Document written with ID: ", docRef.id);
// 		})
// 		.catch(function (error) {
// 			console.log("Error adding document: ", error);
// 		});

// 	}

// 	beginListening(changeListener) {
// 		let query= this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50);
// 		if(this._uid){
// 			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
// 		}
// 		this._unsubscribe = query.onSnapshot((querySnapshot) => {
// 			this._documentSnapshots = querySnapshot.docs;
// 			changeListener();
// 		})
// 	}
// 	stopListening() { 
// 		this._unsubscribe();
// 	   }
// 	get length() { 
// 		return this._documentSnapshots.length;
// 	   }
// 	getPictureAtIndex(index) {
// 		const docSnapshot = this._documentSnapshots[index];
// 		const pic = new rhit.Picture(
// 			docSnapshot.id,
// 			docSnapshot.get(rhit.FB_KEY_URL),
// 			docSnapshot.get(rhit.FB_KEY_CAPTION)
// 		);
// 		return pic;
// 	    }
// }

// rhit.DetailPageController = class {
// 	constructor() {

// 		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
// 			rhit.fbAuthManager.signOut();
// 		});

// 		document.querySelector("#submitEditCaption").addEventListener("click", (event) => {
// 			const caption = document.querySelector("#inputCaption").value;
// 			rhit.fbSinglePictureManager.update(caption);

// 		});

// 		$("#editPhotoCaption").on("show.bs.modal", (event) => {
// 			//Pre animation
// 			document.querySelector("#inputCaption").value = rhit.fbSinglePictureManager.caption;
// 		});
// 		$("#editPhotoCaption").on("shown.bs.modal", (event) => {
// 			//Post animation
// 			document.querySelector("#inputCaption").focus();
// 		});

// 		document.querySelector("#submitDeletePic").addEventListener("click", (event) => {
// 			rhit.fbSinglePictureManager.delete().then(()=> {
// 				console.log("Document successfully deleted!");
// 				window.location.href = "/";
// 			}).catch((error)=>{
// 				console.error("Error removing document: ", error);
// 			});

// 		});

// 		rhit.fbSinglePictureManager.beginListening(this.updateView.bind(this));
// 	}
// 	updateView() {
// 		const cardURL = document.querySelector("#cardURL");
// 		cardURL.setAttribute("src", rhit.fbSinglePictureManager.url);
// 		cardURL.setAttribute("alt", rhit.fbSinglePictureManager.caption);
// 		document.querySelector("#cardCaption").innerHTML = rhit.fbSinglePictureManager.caption;
// 		if(rhit.fbSinglePictureManager.author == rhit.fbAuthManager.uid){
// 			document.querySelector("#menuEdit").style.display="flex";
// 			document.querySelector("#menuDelete").style.display="flex";
// 		}
// 	}
// }

// rhit.FbSinglePictureManager = class {
// 	constructor(picId) {
// 	  this._documentSnapshot = {};
// 	  this._unsubscribe = null;
// 	  this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_PICTURES).doc(picId);
// 	  console.log(`Listening to ${this._ref.path}`);
// 	}
// 	beginListening(changeListener) {
// 		this._unsubscribe =this._ref.onSnapshot((doc) => {
// 			if(doc.exists){
// 				console.log("Document data:", doc.data());
// 				this._documentSnapshot = doc;
// 				changeListener();
// 			} else {
// 				console.log("No such document!");
// 			}
// 		});
// 	}
// 	stopListening() {
// 	  this._unsubscribe();
// 	}
// 	update(caption) {
// 		this._ref.update({
// 			[rhit.FB_KEY_CAPTION]: caption,
// 			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now()
// 		})
// 		.then(() => {
// 			console.log("Document successfully updated!");
// 		})
// 		.catch(function (error) {
// 			console.eroor("Error adding document: ", error);
// 		});
// 	}
// 	delete() {
// 		return this._ref.delete();
// 	}

// 	get url() {
// 		return this._documentSnapshot.get(rhit.FB_KEY_URL);
// 	}
// 	get caption() {
// 		return this._documentSnapshot.get(rhit.FB_KEY_CAPTION);
// 	}
// 	get author() {
// 		return this._documentSnapshot.get(rhit.FB_KEY_AUTHOR);
// 	}
//  }

//  rhit.LoginPageController = class {
// 	constructor() {

// 		document.querySelector("#rosefireButton").onclick = (event) => {
// 			rhit.fbAuthManager.signIn();
// 		};
// 	}
// }

// rhit.FbAuthManager = class {
// 	constructor() {
// 		this._user = null;
// 		console.log("You have made theAuth Manager");
// 	}
// 	beginListening(changeListener) {
// 		firebase.auth().onAuthStateChanged((user) => {
// 			this._user = user;
// 			changeListener();
// 		});
// 	}
// 	signIn() {
// 		console.log("TODO: Sign in usingrosefire");
// 		Rosefire.signIn("79c7d9b9-d08e-49ff-b96d-12eb3d59ab18", (err, rfUser) => {
// 			if (err) {
// 				console.log("Rosefire error!", err);
// 				return;
// 			}
// 			console.log("Rosefire success!", rfUser);

// 			firebase.auth().signInWithCustomToken(rfUser.token).catch((error)=>{
// 				const errorCode = error.code;
// 				const errorMessage = error.message;
// 				if(errorCode === 'auth/invalid-custom-token') {
// 					alert('The token you provided is not valid.');
// 				}else{
// 					console.error("Custom auth error", errorCode, errorMessage);
// 				}
// 			});
// 		});


// 	}
// 	signOut() {
// 		firebase.auth().signOut().catch((error) => {
// 			console.log("Sign out error");
// 		});

// 	}
// 	get isSignedIn() {
// 		// return this._user != null;
// 		//casts truthy or falsy value into true or false
// 		return !!this._user;
// 	}
// 	get uid() {
// 		return this._user.uid;
// 	}
// }


// rhit.checkForRedirects = function() {
// 	if (document.querySelector("#logInPage") && rhit.fbAuthManager.isSignedIn) {
// 		window.location.href = "/bucket.html"
// 	}
// 	if (!document.querySelector("#logInPage") && !rhit.fbAuthManager.isSignedIn) {
// 		window.location.href = "/"
// 	}
// };

// rhit.initializePage = function() {
// 	const urlParams = new URLSearchParams(window.location.search);

// 	if (document.querySelector("#listPage")) {
// 		console.log("You are on the list page.");
// 		const uid = urlParams.get("uid");
// 		rhit.fbPictureManager = new rhit.FbPicturesManager(uid);
// 		new rhit.ListPageController();

// 	}

// 	if (document.querySelector("#detailPage")) {
// 		console.log("You are on the detail page.");
// 		const picId = urlParams.get("id");
// 		if (!picId) {
// 			window.location.href = "/";
// 		}

// 		rhit.fbSinglePictureManager = new rhit.FbSinglePictureManager(picId);
// 		new rhit.DetailPageController();

// 	}

// 	if (document.querySelector("#logInPage")) {
// 		console.log("You are on the logIn page.");
// 		new rhit.LoginPageController();

// 	}
// };


// rhit.startFirebaseUI = function() {
// 	var uiConfig = {
// 		signInSuccessUrl: '/bucket.html',
// 		signInOptions: [
// 		  firebase.auth.GoogleAuthProvider.PROVIDER_ID,
// 		  firebase.auth.EmailAuthProvider.PROVIDER_ID,
// 		  firebase.auth.PhoneAuthProvider.PROVIDER_ID,
// 		  firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
// 		],
// 	  };

// 	  const ui = new firebaseui.auth.AuthUI(firebase.auth());
// 	  ui.start('#firebaseui-auth-container', uiConfig);
// }

// rhit.main = function () {
// 	console.log("Ready");

// 	rhit.fbAuthManager = new rhit.FbAuthManager();
// 	rhit.fbAuthManager.beginListening(() => {
// 		console.log("authchange callback fired.")
// 		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);

// 		//Check for redirects
// 		rhit.checkForRedirects();
// 		//Page initialization
// 		rhit.initializePage();
// 	});

// 	rhit.startFirebaseUI();
// };


// rhit.main();