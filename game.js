// --- ३D गेमचे व्हेरिएबल्स ---
let scene, camera, renderer;
let player, ground;
let bike = null;
let isDriving = false; 

// हालचाली ट्रॅक करण्यासाठी ऑब्जेक्ट
const keys = { w: false, a: false, s: false, d: false };

// --- ३D वर्ल्डची सुरुवात ---
function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); 

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    // जमीन
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.9 });
    ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2; 
    scene.add(ground);

    // रस्ता
    const roadGeo = new THREE.PlaneGeometry(10, 500);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01; 
    scene.add(road);

    // प्लेयर (लाल बॉक्स)
    const playerGeo = new THREE.BoxGeometry(1, 2, 1);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(0, 1, 0); 
    scene.add(player);

    // मोबाईलवरील टच बटनांचे इव्हेंट्स जोडणे
    setupMobileControls();

    window.addEventListener('resize', onWindowResize);
    animate();
}

// --- मोबाईल फोन उघडणे/बंद करणे ---
function toggleMobilePhone() {
    const phone = document.getElementById('phone-container');
    phone.classList.toggle('hidden');
}

// --- मोबाईल मधील चिटकोड चेक करणे ---
function applyCheatCode() {
    const code = document.getElementById('cheat-input').value;
    
    if (code === '9999') {
        alert("चिटकोड यशस्वी! बाईक समोर आली आहे.");
        spawnBike();
        toggleMobilePhone(); // फोन बंद करा
    } else {
        alert("चुकीचा चिटकोड! बाईकसाठी '9999' टाका.");
    }
    document.getElementById('cheat-input').value = ''; 
}

// --- ३D बाईक तयार करणे (Spawn) ---
function spawnBike() {
    if (bike) scene.remove(bike); 

    const bikeGeo = new THREE.BoxGeometry(0.8, 1, 2.5);
    const bikeMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    bike = new THREE.Mesh(bikeGeo, bikeMat);
    
    bike.position.set(player.position.x, 0.5, player.position.z - 4);
    scene.add(bike);
}

// --- मोबाईल टच बटन्सचे लॉजिक ---
function setupMobileControls() {
    const bindControl = (btnId, keyProp) => {
        const btn = document.getElementById(btnId);
        
        // बोटाने दाबून ठेवल्यावर
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[keyProp] = true; });
        // बोट काढल्यावर
        btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[keyProp] = false; });
    };

    bindControl('btn-up', 'w');
    bindControl('btn-down', 's');
    bindControl('btn-left', 'a');
    bindControl('btn-right', 'd');
}

// --- गेम लूप ---
function animate() {
    requestAnimationFrame(animate);

    const moveSpeed = 0.15;

    if (!isDriving) {
        // प्लेयर हालचाल
        if (keys.w) player.position.z -= moveSpeed;
        if (keys.s) player.position.z += moveSpeed;
        if (keys.a) player.position.x -= moveSpeed;
        if (keys.d) player.position.x += moveSpeed;

        camera.position.set(player.position.x, player.position.y + 4, player.position.z + 7);
        camera.lookAt(player.position);

        // बाईकजवळ गेल्यावर ऑटोमॅटिक बसणे
        if (bike && player.position.distanceTo(bike.position) < 1.8) {
            isDriving = true;
            player.visible = false; 
            alert("तुम्ही बाईकवर बसलात! आता चालवा.");
        }
    } else {
        // बाईक हालचाल (स्पीड जास्त)
        if (keys.w) bike.position.z -= moveSpeed * 2.5;
        if (keys.s) bike.position.z += moveSpeed * 2.5;
        if (keys.a) bike.position.x -= moveSpeed * 1.5;
        if (keys.d) bike.position.x += moveSpeed * 1.5;

        camera.position.set(bike.position.x, bike.position.y + 4, bike.position.z + 8);
        camera.lookAt(bike.position);
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.onload = init3D;
