import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, onAuthStateChanged, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import '../style.css';

const firebaseConfig = {
	apiKey: "AIzaSyBgiTHPZN7_9ocKdUJSwDMgiIbqXLhWQCY",
	authDomain: "frbs-pnm.firebaseapp.com",
	projectId: "frbs-pnm",
	storageBucket: "frbs-pnm.firebasestorage.app",
	messagingSenderId: "673208301962",
	appId: "1:673208301962:web:aa59bd34c9f649fbbe3073",
	measurementId: "G-6SN3S9BCQT"
};

// Initialize Firebase and services
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);
const db = getFirestore(app);

const SignInButtonGoogle = document.getElementById('signin-btn-google');
const signupBtn = document.getElementById('signup-btn');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const authStatus = document.getElementById('auth-status');
const memeInput = document.getElementById('meme-input');
const addMemeBtn = document.getElementById('add-meme-btn');
const memesList = document.getElementById('memes-list');
const authSection = document.getElementById('auth-section');
const memesSection = document.getElementById('memes-section');
const signinBtn = document.getElementById('signin-btn');
const signinSection = document.getElementById('signin-section');
const newMemeInputDiv = document.getElementById('new-meme-input');
const imageUploadInput = document.getElementById('image-upload');
const imagePreview = document.getElementById('image-preview');

const displayNameInput = document.getElementById('display-name');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');

const showSignupBtn = document.getElementById('show-signup-btn');
const showLoginBtn = document.getElementById('show-login-btn');
const signupTab = document.getElementById('signup-tab');
const loginTab = document.getElementById('login-tab');

//Sign In section
signinBtn.addEventListener('click', () => {
	authSection.style.display = 'block';
	signinSection.style.display = 'none';
	showLoginTab();
});

let currentUser = null;
let unsubscribeFromMemes = null;
let selectedFile = null;

//Switching tabs Sign Up/Log in
function showSignupTab() {
	signupTab.style.display = 'block';
	loginTab.style.display = 'none';
	showSignupBtn.classList.add('active');
	showLoginBtn.classList.remove('active');
	authStatus.textContent = '';
}

function showLoginTab() {
	signupTab.style.display = 'none';
	loginTab.style.display = 'block';
	showLoginBtn.classList.add('active');
	showSignupBtn.classList.remove('active');
	authStatus.textContent = '';
}

showSignupBtn.addEventListener('click', showSignupTab);
showLoginBtn.addEventListener('click', showLoginTab);

//Email Sign Up
signupBtn.addEventListener('click', async () => {
	const displayName = displayNameInput.value.trim();
	const email = signupEmailInput.value;
	const password = signupPasswordInput.value;

	if (!displayName || !email || !password) {
		alert('To continue, please complete all required fields (*)');
		return;
	}

	try {
        	const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        	console.log('User signed up:', userCredential.user.email);

        	await updateProfile(userCredential.user, { displayName: displayName });
        	console.log('Display name set:', displayName);

        	authStatus.textContent = `Signed up and logged in as: ${displayName},`;
	} catch (error) {
        	authStatus.textContent = `Error signing up: ${error.message}`;
        	console.error('Sign up error:', error);
	}
});

//Email Log in
loginBtn.addEventListener('click', () => {
	const email = loginEmailInput.value;
	const password = loginPasswordInput.value;
	signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
		console.log('User logged in:', userCredential.user.email);
		authStatus.textContent = `${userCredential.user.displayName},`;
        })
        .catch((error) => {
		authStatus.textContent = `Error logging in: ${error.message}`;
		console.error('Login error:', error);
        });
});

//Google Auth
const provider = new GoogleAuthProvider();

SignInButtonGoogle.addEventListener('click', () => {
	signInWithPopup(auth, provider)
	.then((result) => {
		// The signed-in user info.
		const user = result.user;
		console.log('User signed in with Google:', result.user.email);

	}).catch((error) => {
		console.error('Google Sign-in error:', error);
	});
});

//Logout
logoutBtn.addEventListener('click', () => {
	signOut(auth)
        .then(() => {
		console.log('User logged out');
		authStatus.textContent = 'Logged out,';
		newMemeInputDiv.style.display = 'none';
		authSection.style.display = 'none';
		if (unsubscribeFromMemes) {
			unsubscribeFromMemes();
			unsubscribeFromMemes = null;
		}
		loadMemes();
		resetPostForm();
        })
        .catch((error) => {
		authStatus.textContent = `Error logging out: ${error.message}`;
		console.error('Logout error:', error);
        });
});

//User status change
onAuthStateChanged(auth, (user) => {
	currentUser = user;
	if (user) {
		const userName = user.displayName || user.email;
		authStatus.textContent = `${userName},`;
		logoutBtn.style.display = 'inline-block';
		signinBtn.style.display = 'none';
		newMemeInputDiv.style.display = 'block';
		authSection.style.display = 'none';
		signinSection.style.display = 'block';
	} else {
		authStatus.textContent = '';
		logoutBtn.style.display = 'none';
		signinBtn.style.display = 'inline-block';
		newMemeInputDiv.style.display = 'none';
		resetPostForm();
	}
	if (unsubscribeFromMemes) {
		unsubscribeFromMemes();
		unsubscribeFromMemes = null;
	}
	loadMemes();
});

//Image upload
imageUploadInput.addEventListener('change', (event) => {
    selectedFile = event.target.files[0];
    if (selectedFile) {
	    const allowedTypes = ['image/jpeg', 'image/png'];

	    if (allowedTypes.includes(selectedFile.type)){
            // Display image preview
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(selectedFile);
	    } else {
		alert ('Please select a JPG or PNG image');
		imageUploadInput.value = '';
		imagePreview.src = '#';
		imagePreview.style.display = 'none';
		selectedFile = null;
            }
	} else {
            imagePreview.src = '#';
            imagePreview.style.display = 'none';
        }
});

// Function to save to Firestore
async function saveMemeToFirestore(text, imageUrl) {
	try {
		await addDoc(collection(db, 'public_memes'), {
			text: text,
			imageUrl: imageUrl,
			timestamp: serverTimestamp(),
			userId: currentUser.uid,
			userEmail: currentUser.email,
			userName: currentUser.displayName
		});
		console.log('Meme saved successfully!');
	} catch (error) {
		console.error('Error saving meme:', error);
		alert(`Error saving meme: ${error.message}`);
	}
}

//Resetting the form
function resetPostForm() {
	memeInput.value = '';
	selectedFile = null;
	imageUploadInput.value = '';
	imagePreview.src = '#';
	imagePreview.style.display = 'none';
}

//Add a meme
addMemeBtn.addEventListener('click', async () => {
	const memeText = memeInput.value.trim();
	if (!currentUser) {
		alert('You must be logged in to add a meme.');
		return;
	}
	if (!memeText && !selectedFile) {
		alert('Please enter text or select an image to share a meme.');
		return;
	}

	let imageUrl = null;
	if (selectedFile) {
		addMemeBtn.disabled = true;
		addMemeBtn.textContent = 'Uploading...';
		try {
			// Unique path images/user_id/timestamp_filename
			const storageRef = ref(storage, `images/${currentUser.uid}/${Date.now()}_${selectedFile.name}`);
			const snapshot = await uploadBytes(storageRef, selectedFile);
			imageUrl = await getDownloadURL(snapshot.ref);
			console.log('Image uploaded. Download URL:', imageUrl);
		} catch (error) {
			console.error('Image upload failed:', error);
			alert(`Image upload failed: ${error.message}`);
			resetPostForm();
			addMemeBtn.disabled = false;
			addMemeBtn.textContent = 'Share Meme!';
			return;
		}
	}

	// Save the meme (with or without image URL)
	await saveMemeToFirestore(memeText, imageUrl);
	resetPostForm();
	addMemeBtn.disabled = false;
	addMemeBtn.textContent = 'Share Meme!';
});

// Load and display all memes
function loadMemes() {
	if (unsubscribeFromMemes) {
		unsubscribeFromMemes();
	}

	const publicMemesCollectionRef = collection(db, 'public_memes');
    	const q = query(publicMemesCollectionRef, orderBy('timestamp', 'desc'));

	unsubscribeFromMemes = onSnapshot(q, (snapshot) => {
		memesList.innerHTML = '';

		snapshot.forEach((doc) => {
			const meme = doc.data();
			const listItem = document.createElement('li');

			let formattedDate = 'Pending...';
			if (meme.timestamp) {
				const date = meme.timestamp.toDate ? meme.timestamp.toDate() : new Date(meme.timestamp);
				const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
				formattedDate = date.toLocaleDateString('en-US', options);
			}

			const posterInfo = meme.userName || meme.userEmail || 'Anonymous';
			// Poster Avatar
			const posterChar = posterInfo.charAt(0);
			const avatarImage = document.createElement ('div');
			avatarImage.classList.add('avatar');
			avatarImage.textContent = `${posterChar}`;
			listItem.appendChild(avatarImage);

			const metaInfo = document.createElement ('span');
			metaInfo.innerHTML = `${posterInfo} <p style="margin-top: 0px;"><small style="color: #757575; font-weight: normal;">${formattedDate}</small></p>`;
			metaInfo.style.display = 'block';
			listItem.appendChild(metaInfo);

			const textNode = document.createElement('p');
			textNode.textContent = meme.text;
			listItem.appendChild(textNode);

			// Add image if available
			if (meme.imageUrl) {
				const postImage = document.createElement('img');
				postImage.src = meme.imageUrl;
				postImage.alt = 'Attached Image';
				postImage.style.maxWidth = '100%';
				postImage.style.height = 'auto';
				postImage.style.display = 'block';
				postImage.style.marginTop = '20px';
				postImage.style.borderRadius = '4px';
				listItem.appendChild(postImage);
			}

			memesList.appendChild(listItem);
		});
	}, (error) => {
		console.error("Error fetching documents: ", error);
		memesList.innerHTML = '<li>Error loading memes.</li>';
	});
}

loadMemes();
