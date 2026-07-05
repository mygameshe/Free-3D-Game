// --- ३D गेम सेटअप ---
let scene, camera, renderer;
let player, ground;
let bike = null;
let isDriving = false; // कॅरेक्टर बाईकवर बसला आहे की नाही

// हालचालींचे कंट्रोल्स ट्रॅक करण्यासाठी
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

function init3D() {
    // १. सीन (Scene) तयार करणे
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0); // आकाशाचा/बॅकग्राउंडचा रंग

    // २. कॅमेरा सेट करणे
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10); // कॅमेरा प्लेयरच्या मागे वर असेल

    // ३. रेंडरर (Renderer) तयार करणे
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // ४. लाईट्स (Lights) जोडणे
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    // ५. जमीन (Ground/World) तयार करणे
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2; // जमीन सपाट करण्यासाठी
    scene.add(ground);

    // ६. कॅरेक्टर (Player) तयार करणे (साधा लाल रंगाचा बॉक्स)
    const playerGeo = new THREE.BoxGeometry(1, 2, 1);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 1; // जमिनीच्या वर ठेवण्यासाठी
    scene.add(player);

    // कीबोर्ड इव्हेंट्स ऐकणे
    window.addEventListener('keydown', (e) => handleKeyDown(e));
    window.addEventListener('keyup', (e) => handleKeyUp(e));
    window.addEventListener('resize', onWindowResize);

    animate();
}

// --- मोबाईल फोन चालू/बंद करणे ---
function handleKeyDown(e) {
    if (e.key === 'm' || e.key === 'M') {
        const phone = document.getElementById('phone-container');
        phone.classList.toggle('hidden');
        return;
    }
    
    // जर टाईप करत असाल तर गेम कंट्रोल्स थांबवणे
    if (document.activeElement === document.getElementById('cheat-input')) return;

    if (e.key in keys) keys[e.key] = true;
}

function handleKeyUp(e) {
    if (e.key in keys) keys[e.key] = false;
}

// --- चिटकोड सिस्टीम (Apply Cheat Code) ---
function applyCheatCode() {
    const code = document.getElementById('cheat-input').value;
    
    if (code === '9999') {
        alert("चिटकोड यशस्वी! बाईक प्रकट झाली आहे.");
        spawnBike();
        document.getElementById('phone-container').classList.add('hidden'); // मोबाईल बंद करा
    } else {
        alert("चुकीचा चिटकोड! '9999' वापरून पहा.");
    }
    document.getElementById('cheat-input').value = ''; // इनपुट रिकामे करा
}

// --- ३D बाईक प्रकट करणे (Spawn Bike) ---
function spawnBike() {
    // जुनी बाईक असेल तर काढून टाकणे
    if (bike) scene.add(bike); 

    // साधी ३D बाईक डिझाईन (एक निळा लांब बॉक्स)
    const bikeGeo = new THREE.BoxGeometry(0.8, 1, 2);
    const bikeMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    bike = new THREE.Mesh(bikeGeo, bikeMat);
    
    // बाईक प्लेयरच्या अगदी समोर प्रकट होईल
    bike.position.set(player.position.x, 0.5, player.position.z - 3);
    scene.add(bike);
}

// --- गेम लूप आणि हालचाली (Movement Logic) ---
function animate() {
    requestAnimationFrame(animate);

    const speed = 0.1;

    if (!isDriving) {
        // १. कॅरेक्टर चालवण्याचे लॉजिक
        if (keys.w || keys.ArrowUp) player.position.z -= speed;
        if (keys.s || keys.ArrowDown) player.position.z += speed;
        if (keys.a || keys.ArrowLeft) player.position.x -= speed;
        if (keys.d || keys.ArrowRight) player.position.x += speed;

        // कॅमेरा प्लेयरच्या मागे ठेवणे
        camera.position.set(player.position.x, player.position.y + 4, player.position.z + 6);
        camera.lookAt(player.position);

        // जर प्लेयर बाईकच्या खूप जवळ गेला तर ऑटोमॅटिक बाईकवर बसेल
        if (bike && player.position.distanceTo(bike.position) < 1.5) {
            isDriving = true;
            player.visible = false; // कॅरेक्टर बाईकच्या आत बसेल म्हणून लपवा
            alert("तुम्ही बाईकवर बसलात! आता चालवा.");
        }
    } else {
        // २. बाईक चालवण्याचे लॉजिक
        if (keys.w || keys.ArrowUp) bike.position.z -= speed * 2; // बाईक जोरात धावेल
        if (keys.s || keys.ArrowDown) bike.position.z += speed * 2;
        if (keys.a || keys.ArrowLeft) bike.position.x -= speed * 1.5;
        if (keys.d || keys.ArrowRight) bike.position.x += speed * 1.5;

        // कॅमेरा बाईकच्या मागे ठेवणे
        camera.position.set(bike.position.x, bike.position.y + 4, bike.position.z + 6);
        camera.lookAt(bike.position);
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// गेम सुरू झाल्यावर ३D वर्ल्ड लोड करा
window.onload = init3D;
