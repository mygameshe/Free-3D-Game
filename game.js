// --- ३D गेमचे व्हेरिएबल्स ---
let scene, camera, renderer;
let player, ground;
let bike = null;
let isDriving = false; // प्लेयर गाडीवर बसला आहे की नाही ट्रॅक करण्यासाठी

// कीबोर्ड बटनांची स्थिती
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

// --- ३D वर्ल्डची सुरुवात (Initialization) ---
function init3D() {
    // १. सीन तयार केला
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // आकाशी रंग (Sky Blue)

    // २. कॅमेरा सेट केला
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // ३. रेंडरर सेट केला
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // ४. गेममध्ये प्रकाश (Lights) जोडला
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    // ५. ३D जमीन (Green Ground) तयार केली
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.9 });
    ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2; // जमीन सपाट केली
    scene.add(ground);

    // ६. ३D रस्ता (Road) तयार केला
    const roadGeo = new THREE.PlaneGeometry(10, 500);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01; // जमिनीच्या किंचित वर जेणेकरून रस्ता स्पष्ट दिसेल
    scene.add(road);

    // ७. ३D कॅरेक्टर/प्लेयर (लाल रंगाचा बॉक्स)
    const playerGeo = new THREE.BoxGeometry(1, 2, 1);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(0, 1, 0); // जमिनीवर उभे केले
    scene.add(player);

    // कीबोर्ड इव्हेंट्स ऐकणे (Event Listeners)
    window.addEventListener('keydown', (e) => handleKeyDown(e));
    window.addEventListener('keyup', (e) => handleKeyUp(e));
    window.addEventListener('resize', onWindowResize);

    // गेम लूप सुरू करणे
    animate();
}

// --- मोबाईल चालू/बंद करण्याचे लॉजिक ---
function handleKeyDown(e) {
    if (e.key === 'm' || e.key === 'M') {
        const phone = document.getElementById('phone-container');
        phone.classList.toggle('hidden'); // 'M' दाबलं की मोबाईल दिसेल किंवा लपेल
        return;
    }
    
    // जर युझर मोबाईलच्या इनपुट बॉक्समध्ये टाईप करत असेल, तर गेम कॅरेक्टर हलणार नाही
    if (document.activeElement === document.getElementById('cheat-input')) return;

    if (e.key in keys) keys[e.key] = true;
}

function handleKeyUp(e) {
    if (e.key in keys) keys[e.key] = false;
}

// --- मोबाईल मधील चिटकोड चेक करणे ---
function applyCheatCode() {
    const code = document.getElementById('cheat-input').value;
    
    if (code === '9999') {
        alert("चिटकोड बरोबर आहे! बाईक तुमच्या समोर आली आहे.");
        spawnBike();
        document.getElementById('phone-container').classList.add('hidden'); // मोबाईल बंद करा
    } else {
        alert("चुकीचा चिटकोड! बाईकसाठी '9999' टाका.");
    }
    document.getElementById('cheat-input').value = ''; // बॉक्स रिकामा करा
}

// --- ३D बाईक तयार करणे (Spawn) ---
function spawnBike() {
    // जर आधीच बाईक असेल तर ती काढून नवीन आणणे
    if (bike) scene.remove(bike); 

    // साधी ३D बाईक (एक निळ्या रंगाचा लांब बॉक्स)
    const bikeGeo = new THREE.BoxGeometry(0.8, 1, 2.5);
    const bikeMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    bike = new THREE.Mesh(bikeGeo, bikeMat);
    
    // बाईक कॅरेक्टरच्या ३ युनिट समोर उभी होईल
    bike.position.set(player.position.x, 0.5, player.position.z - 3);
    scene.add(bike);
}

// --- गेम लूप (हालचाली आणि कॅमेरा अपडेट) ---
function animate() {
    requestAnimationFrame(animate);

    const moveSpeed = 0.15;

    if (!isDriving) {
        // --- १. कॅरेक्टर चालवण्याचे लॉजिक ---
        if (keys.w || keys.ArrowUp) player.position.z -= moveSpeed;
        if (keys.s || keys.ArrowDown) player.position.z += moveSpeed;
        if (keys.a || keys.ArrowLeft) player.position.x -= moveSpeed;
        if (keys.d || keys.ArrowRight) player.position.x += moveSpeed;

        // कॅमेरा नेहमी कॅरेक्टरच्या मागे धावणार
        camera.position.set(player.position.x, player.position.y + 4, player.position.z + 7);
        camera.lookAt(player.position);

        // जर कॅरेक्टर चिटकोडने आणलेल्या बाईकच्या जवळ (1.5 मीटर) गेला तर तो ऑटोमॅटिक गाडीवर बसेल
        if (bike && player.position.distanceTo(bike.position) < 1.5) {
            isDriving = true;
            player.visible = false; // कॅरेक्टर बाईक चालवत असल्याने त्याला लपवले
            alert("तुम्ही बाईकवर बसलात! आता चालवा.");
        }
    } else {
        // --- २. बाईक चालवण्याचे लॉजिक (स्पीड जास्त असेल) ---
        if (keys.w || keys.ArrowUp) bike.position.z -= moveSpeed * 2.5;
        if (keys.s || keys.ArrowDown) bike.position.z += moveSpeed * 2.5;
        if (keys.a || keys.ArrowLeft) bike.position.x -= moveSpeed * 1.8;
        if (keys.d || keys.ArrowRight) bike.position.x += moveSpeed * 1.8;

        // कॅमेरा नेहमी बाईकच्या मागे धावणार
        camera.position.set(bike.position.x, bike.position.y + 4, bike.position.z + 8);
        camera.lookAt(bike.position);
    }

    renderer.render(scene, camera);
}

// स्क्रीन लहान-मोठी झाल्यावर 3D स्क्रीन ॲडजस्ट करणे
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// पेज लोड झाल्यावर ३D गेम सुरू करणे
window.onload = init3D;
