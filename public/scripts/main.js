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
rhit.FB_COLLECTION_USERS = "Users";
rhit.FB_KEY_USERSONGS = "userSongs";
rhit.FB_KEY_ISDARKMODE = "isDarkMode";
rhit.FB_KEY_OPACITY = "Opacity";
rhit.FB_KEY_USER_CREATED = "userCreatedTime"
rhit.fbSongManager = null;
rhit.fbSingleSongManager = null;
rhit.fbUserManager = null;
rhit.fbSingleUserManager = null;
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
	get document() {
		return this._documentSnapshots;
	}
	getSongAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const song = new rhit.Song(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_YTKEY),
			docSnapshot.get(rhit.FB_KEY_ARTIST),
			docSnapshot.get(rhit.FB_KEY_TITLE),
			docSnapshot.get(rhit.FB_KEY_USER_RANKING),
			docSnapshot.get(rhit.FB_KEY_USER_RATING),
			docSnapshot.get(rhit.FB_KEY_GLOBAL_RANKING)
		);
		return song;
	}
}

rhit.HomePageController = class {
	constructor() {
		this._randSong = Math.floor(Math.random() * 100);
		this._tempRating = 4;
		var userSongs = [];
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#submitSong").addEventListener("click", (event) => {
			var user = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(rhit.fbSingleUserManager.userId).get().then(snapshot=>{
				// console.log(snapshot.data())
				userSongs = snapshot.data().userSongs;
			});
			if(userSongs.includes(data[this._randSong].key)){
				console.log("already in usersongs");
				document.querySelector("#dataWarning").innerHTML = "Song aready in User's Data"
			} else{
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
					document.querySelector("#guessResult").innerHTML = `Your Guess: ${ranking}<br>True Ranking: ${this._randSong}`
					console.log(rhit.fbSongManager);
					rhit.fbSingleUserManager.updateSongs(data[this._randSong].key);
				}
			}
		});
		// console.log(rhit.fbSingleUserManager.userId);
		document.querySelector("#newSong").addEventListener("click", (event) => {
			var user = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(rhit.fbSingleUserManager.userId).get().then(snapshot=>{
				// console.log(snapshot.data())
				userSongs = snapshot.data().userSongs;
			});
			console.log(userSongs);
			this._randSong = Math.floor(Math.random() * 100);
			// console.log(userSongs);
			// if(userSongs.includes(data[this._randSong].key)){
			// 	console.log(data[this._randSong].title);
			// }
			while(userSongs.includes(data[this._randSong].key)){
				this._randSong = Math.floor(Math.random() * 100);
			}
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
		document.onload = function(){
			document.querySelector("#newSong").click();
			console.log("window load!");
		}
		rhit.fbSongManager.beginListening(this.updateView.bind(this));
		rhit.fbSingleUserManager.beginListening(this.updateView.bind(this));
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

		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		}); 

		document.querySelector("#userData").addEventListener("click", (event)=>{
			if(document.querySelector("#globalData").classList.contains("currentData")){
				document.querySelector("#globalData").classList.toggle("currentData");
				// document.querySelector("#userData").classList.toggle("currentData");
			}
			if(document.querySelector("#myData").classList.contains("currentData")){
				document.querySelector("#myData").classList.toggle("currentData");
			}
			document.querySelector("#userData").classList.toggle("currentData");
			window.location.href = `/data.html`;
			this.showUserData = true;
			this.updateList();

		});
		document.querySelector("#globalData").addEventListener("click", (event)=>{
			if(document.querySelector("#userData").classList.contains("currentData")){
				document.querySelector("#userData").classList.toggle("currentData");
				// document.querySelector("#globalData").classList.toggle("currentData");
			}
			if(document.querySelector("#myData").classList.contains("currentData")){
				document.querySelector("#myData").classList.toggle("currentData");
			}
			document.querySelector("#globalData").classList.toggle("currentData");
			// window.location.href = `/data.html`;
			this.showUserData = false;
			this.updateList();

		});
		document.querySelector("#myData").addEventListener("click", (event) => {
			if(document.querySelector("#userData").classList.contains("currentData")){
				document.querySelector("#userData").classList.toggle("currentData");
				// document.querySelector("#myData").classList.toggle("currentData");
			}
			if(document.querySelector("#globalData").classList.contains("currentData")){
				document.querySelector("#globalData").classList.toggle("currentData");
			}
			document.querySelector("#myData").classList.toggle("currentData");
			window.location.href = `/data.html?uid=${rhit.fbAuthManager.uid}`;
		});
		//JS for data search
		// document.querySelector("#searchButton").addEventListener("click", () => {
		// 	console.log(rhit.fbSongManager.document);
		// 	// alert(document.querySelector("#searchInput").value);
		// 	//not yet finished
		// 	// if(!(document.querySelector("#searchInput").value == "")) {
		// 	// 	var /*input, */filter, ul, li, a, i, txtValue;
		// 	// 	//input = document.getElementById('myInput');
		// 	// 	filter = document.querySelector("#searchInput").value.toUpperCase();//input.value.toUpperCase();
		// 	// 	ul = document.getElementById("myUL");
		// 	// 	li = ul.getElementsByTagName('li');

		// 	// 	// Loop through all list items, and hide those who don't match the search query
		// 	// 	for (i = 0; i < li.length; i++) {
		// 	// 		a = li[i].getElementsByTagName("a")[0];
		// 	// 		txtValue = a.textContent || a.innerText;
		// 	// 		if (txtValue.toUpperCase().indexOf(filter) > -1) {
		// 	// 			li[i].style.display = "";
		// 	// 		} else {
		// 	// 			li[i].style.display = "none";
		// 	// 		}
		// 	// 	}
		// 	// }
		// });
		document.querySelector("#searchButton").addEventListener('click', (event)=>{
			const searchString = document.querySelector("#searchInput").value.toLowerCase();
			document.querySelectorAll(".card").forEach(card=>{
				const cardtext = card.dataset.text.toLowerCase();
				if(cardtext.includes(searchString)){
					card.style.display = "block";
				}else{
					card.style.display = "none";
				}
			})
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

		if(window.location.href == `/data.html?uid=${rhit.fbAuthManager.uid}`){
			document.querySelector("#myData").classList.toggle("currentData");
		}

		const oldList = document.querySelector("#songListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;

		oldList.parentElement.appendChild(newList);
	}

	_createCard(song) {
		return htmlToElement(`
			<div class="card" id="card" data-text="${song.title} ${song.artist}">
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
			<div class="card" id="card" data-text="${song.title} ${song.artist}">
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
			console.error("Error adding document: ", error);
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
		var userSongs = [];
		document.querySelector("#submitAddSong").addEventListener("click", (event) => {
			var user = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(rhit.fbSingleUserManager.userId).get().then(snapshot=>{
				// console.log(snapshot.data())
				userSongs = snapshot.data().userSongs;
			});
			if(userSongs.includes(data[this._index].key)){
				console.log("already in usersongs");
				document.querySelector("#dataWarning").innerHTML = "Song aready in User's Data"
			}else{
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
					rhit.fbSingleUserManager.updateSongs(data[this._index].key);
				}
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
		document.querySelector("#cardData").innerHTML = `True Ranking: ${this._index+1}`
	}
}

rhit.ProfilePageController = class {
	constructor() {
		const user = firebase.auth().currentUser;
		if (user !== null) {
			// The user object has basic properties such as display name, email, etc.
			this.displayName = user.displayName;
			this.email = user.email;
			this.photoURL = user.photoURL;
		}
		document.querySelector("#signOutButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector("#submitEditUser").addEventListener("click", (event)=>{
			user.updateProfile({
				displayName: document.querySelector("#inputName").value,
				photoURL: document.querySelector("#inputImage").value
			  }).then(() => {
				// Update successful
				// ...
			  }).catch((error) => {
				// An error occurred
				// ...
			  }); 
		});
		$("#editUserDialog").on("show.bs.modal", (event) => {
			//Pre animation
			document.querySelector("#inputName").value = this.displayName;
		});
		$("#editUserDialog").on("shown.bs.modal", (event) => {
			//Post animation
			document.querySelector("#inputName").focus();
		});

		const slider = document.getElementById("opacityRange");
		const root = document.documentElement;
		slider.oninput = function() {
			console.log(slider.value*.01);
			root.style.setProperty('--opacity', slider.value*.01);
			localStorage.setItem('data-opacity', slider.value*.01);
			rhit.fbSingleUserManager.updateOpacity(slider.value*.01);
		}

		document.querySelector("#darkModeButton").addEventListener("click", (event)=>{
			console.log("darkmode button pressed");
			let currentMode = window.getComputedStyle(document.documentElement).getPropertyValue('--background-mode');
			if(currentMode == 'black'){
				root.style.setProperty('--background-mode', "#ababab");
				root.style.setProperty('--text-mode', "black");
				localStorage.setItem('data-theme', 'light');
				rhit.fbSingleUserManager.updateDarkMode(false);
			} else{
				root.style.setProperty('--background-mode', "black");
				root.style.setProperty('--text-mode', "white");
				localStorage.setItem('data-theme', 'dark');
				rhit.fbSingleUserManager.updateDarkMode(true);
			}
		});
		
		this.updateView();
		rhit.fbSingleUserManager.beginListening(this.updateView.bind(this));
	}

	updateView() {
		document.querySelector("#userInformation").innerHTML = `Name: ${this.displayName}<br>Email: ${this.email}`;
		if(this.photoURL!=undefined){
			document.querySelector("#userImage").setAttribute("src", this.photoURL);
			document.querySelector("#unsplashInfo").innerHTML = "";
		}

	}
}

rhit.FbUsersManager = class {

	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS);
		this._unsubscribe = null;
	}

	add() {

		firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(rhit.fbAuthManager.uid).set({
			[rhit.FB_KEY_ISDARKMODE]: true,
			[rhit.FB_KEY_OPACITY]: 1,
			[rhit.FB_KEY_USER_CREATED]: firebase.firestore.Timestamp.now(), 
			[rhit.FB_KEY_USERSONGS]: ["UserSongs"]
		}).then(()=>{
			console.log("Document successfully written!");
		})
			.catch(function (error) {
				console.log("Error adding document: ", error);
			});

	}

	beginListening(changeListener) {
		let query = this._ref.orderBy(rhit.FB_KEY_USER_CREATED, "desc").limit(50);
		// if (this._uid) {
		// 	query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		// }
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
	getUserById(userId) {
		const docSnapshot = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(userId);
		const user = new rhit.User(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_USERSONGS),
			docSnapshot.get(rhit.FB_KEY_OPACITY),
			docSnapshot.get(rhit.FB_KEY_ISDARKMODE)
		);
		return user;
	}
}

rhit.User = class {
	constructor(id, usersongs, opacity, isDarkMode){
		this.id = id;
		this.userSongs = usersongs;
		this.opacity = opacity;
		this.isDarkMode = isDarkMode;
	}
}

rhit.FbSingleUserManager = class {
	constructor(userId) {
		this._userId = userId;
	  this._documentSnapshot = {};
	  this._unsubscribe = null;
	  this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(userId);
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
	updateSongs(key) {
		this._ref.update({
			[rhit.FB_KEY_USERSONGS]: firebase.firestore.FieldValue.arrayUnion(key)
		})
		.then(() => {
			console.log("Document successfully updated!");
		})
		.catch(function (error) {
			console.error("Error adding document: ", error);
		});
	}
	updateOpacity(opacity) {
		this._ref.update({
			[rhit.FB_KEY_OPACITY]: opacity
		})
		.then(() => {
			console.log("Document successfully updated!");
		})
		.catch(function (error) {
			console.error("Error adding document: ", error);
		});
	}
	updateDarkMode(isDarkMode) {
		this._ref.update({
			[rhit.FB_KEY_ISDARKMODE]: isDarkMode
		})
		.then(() => {
			console.log("Document successfully updated!");
		})
		.catch(function (error) {
			console.error("Error adding document: ", error);
		});
	}
	deleteUser() {
		return this._ref.delete();
	}
	deleteSong() {
		this._ref.update({
			[rhit.FB_KEY_USERSONGS]: firebase.firestore.FieldValue.arrayRemove(key)
		})
		.then(() => {
			console.log("Document successfully updated!");
		})
		.catch(function (error) {
			console.error("Error adding document: ", error);
		});
	}
	get userId(){
		return this._userId;
	}
	get userSongs() {
		return firebase.firestore.collection(rhit.FB_COLLECTION_USERS).doc(this._userId).get(rhit.FB_KEY_USERSONGS);
	}
	get isDarkMode() {
		return this._documentSnapshot.getValue(rhit.FB_KEY_ISDARKMODE);
	}
	get opacity() {
		return this._documentSnapshot.getValue(rhit.FB_KEY_OPACITY);
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
		localStorage.clear();

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
		rhit.fbSingleUserManager = new rhit.FbSingleUserManager(rhit.fbAuthManager.uid);
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
		rhit.fbSongManager = new rhit.FbSongsManager(uid);
		new rhit.DetailPageController();
	}

	if (document.querySelector("#globalSongPage")) {
		console.log("You are on the global song page.");
		const uid = urlParams.get("id");
		rhit.fbSingleUserManager = new rhit.FbSingleUserManager(rhit.fbAuthManager.uid);
		rhit.fbSingleSongManager = new rhit.FbSongsManager;
		rhit.fbSongManager = new rhit.FbSongsManager(uid);
		new rhit.GlobalDetailPageController(uid);
	}

	if (document.querySelector("#profilePage")) {
		console.log("You are on the profile page.");
		rhit.fbSingleUserManager = new rhit.FbSingleUserManager(rhit.fbAuthManager.uid);
		new rhit.ProfilePageController;

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
	rhit.fbUserManager = new rhit.FbUsersManager();
	rhit.fbAuthManager.beginListening(() => {
		// rhit.loadSettings();
		console.log("authchange callback fired.")
		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);
		// var user = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(rhit.fbAuthManager.uid).get().then(snapshot=>{
		// 	if(!snapshot.exists){
		// 	}
		// });
		// rhit.fbUserManager.add(rhit.fbAuthManager.uid);
		// rhit.fbSingleUserManager = new rhit.FbSingleUserManager(rhit.fbAuthManager.uid);
		//Check for redirects
		rhit.checkForRedirects();
		//Page initialization
		rhit.initializePage();
	});
	rhit.startFirebaseUI();
};

window.onload = function(){
	console.log("page loaded");
	const root = document.documentElement;
	root.style.setProperty('--opacity', localStorage.getItem('data-opacity'));
    if(localStorage.getItem('data-theme') == 'light'){
		root.style.setProperty('--background-mode', "#ababab");
		root.style.setProperty('--text-mode', "black");
    } else{
        root.style.setProperty('--background-mode', "black");
		root.style.setProperty('--text-mode', "white");
    }
}

rhit.main();