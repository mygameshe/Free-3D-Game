let scene, camera, renderer;
let player, ground;
let vehicle = null; // यामध्ये बाईक किंवा कार सेव्ह होईल
let vehicleType = ""; // "bike" किंवा "car"
let isDriving = false; 

const keys = { w: false, a: false, s: false, d: false };

function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x5ca4a9); // सुंदर आकाश

    // कॅमेरा अँगल रुंद (GTA 5 सारखा)
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // लाईट्स
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    // मोठे मैदान
    const groundGeo = new THREE.PlaneGeometry(1000, 1000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.9 });
    ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2; 
    scene.add(ground);

    // **रुंद हायवे रस्ता (GTA 5 सारखा मोठा रस्ता)**
    const roadGeo = new THREE.PlaneGeometry(25, 1000); // रुंदी २५ केली
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.02; 
    scene.add(road);

    // रस्त्यावरील पांढऱ्या लाईन्स (Center Lines)
    for(let i = -500; i < 500; i += 30) {
        const lineGeo = new THREE.PlaneGeometry(0.5, 10);
        const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, 0.03, i);
        scene.add(line);
    }

    // कॅरेक्टर/प्लेयर (लाल रंगाचा ३D बॉक्स)
    const playerGeo = new THREE.BoxGeometry(1, 2, 1);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0xd90429 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(0, 1, 0); 
    scene.add(player);

    setupMobileControls();
    window.addEventListener('resize', onWindowResize);
    animate();
}

function toggleMobilePhone() {
    const phone = document.getElementById('phone-container');
    phone.classList.toggle('hidden');
}

function applyCheatCode() {
    const code = document.getElementById('cheat-input').value;
    
    if (code === '9999') {
        alert("बाईक रेडी आहे!");
        spawnVehicle("bike");
        toggleMobilePhone(); 
    } else if (code === '1111') {
        alert("कार रेडी आहे!");
        spawnVehicle("car");
        toggleMobilePhone();
    } else {
        alert("चुकीचा कोड! बाईक: 9999 | कार: 1111");
    }
    document.getElementById('cheat-input').value = ''; 
}

// --- बाईक आणि कार तयार करणे (चाकांसह) ---
function spawnVehicle(type) {
    if (vehicle) scene.remove(vehicle); 
    vehicleType = type;

    vehicle = new THREE.Group(); // मुख्य बॉडी आणि चाके एकत्र करण्यासाठी ग्रुप

    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

    if (type === "bike") {
        // बाईकची मुख्य बॉडी (निळी)
        const bodyGeo = new THREE.BoxGeometry(0.5, 0.8, 2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0041c2, roughness: 0.2 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.5;
        vehicle.add(body);

        // २ चाके (पुढचे आणि मागचे चाक)
        const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
        frontWheel.rotation.z = Math.PI / 2;
        frontWheel.position.set(0, 0.4, -0.9);
        vehicle.add(frontWheel);

        const backWheel = frontWheel.clone();
        backWheel.position.set(0, 0.4, 0.9);
        vehicle.add(backWheel);

    } else if (type === "car") {
        // कारची मुख्य बॉडी (पिवळी स्पोर्ट्स कार)
        const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.2 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        vehicle.add(body);

        // कारचा वरचा टॉप (Cabin)
        const cabinGeo = new THREE.BoxGeometry(1.6, 0.6, 2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.3, -0.2);
        vehicle.add(cabin);

        // ४ चाके (पुढची दोन, मागची दोन)
        const w1 = new THREE.Mesh(wheelGeo, wheelMat); w1.rotation.z = Math.PI/2; w1.position.set(1.1, 0.4, -1.3); vehicle.add(w1);
        const w2 = w1.clone(); w2.position.set(-1.1, 0.4, -1.3); vehicle.add(w2);
        const w3 = w1.clone(); w3.position.set(1.1, 0.4, 1.3); vehicle.add(w3);
        const w4 = w1.clone(); w4.position.set(-1.1, 0.4, 1.3); vehicle.add(w4);
    }

    vehicle.position.set(player.position.x, 0, player.position.z - 5);
    scene.add(vehicle);
    isDriving = false;
    player.visible = true;
}

function setupMobileControls() {
    const bindControl = (btnId, keyProp) => {
        const btn = document.getElementById(btnId);
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[keyProp] = true; });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[keyProp] = false; });
    };
    bindControl('btn-up', 'w');
    bindControl('btn-down', 's');
    bindControl('btn-left', 'a');
    bindControl('btn-right', 'd');
}

function animate() {
    requestAnimationFrame(animate);
    const moveSpeed = 0.15;

    if (!isDriving) {
        // प्लेयर चालणे
        if (keys.w) player.position.z -= moveSpeed;
        if (keys.s) player.position.z += moveSpeed;
        if (keys.a) player.position.x -= moveSpeed;
        if (keys.d) player.position.x += moveSpeed;

        // प्लेयर कॅमेरा व्ह्यू
        camera.position.set(player.position.x, player.position.y + 3, player.position.z + 6);
        camera.lookAt(player.position.x, player.position.y + 0.5, player.position.z - 2);

        // गाडी जवळ गेल्यावर बसणे
        if (vehicle && player.position.distanceTo(vehicle.position) < 2) {
            isDriving = true;
            player.visible = false;
            alert(vehicleType === "bike" ? "बाईकवर बसलात!" : "कारमध्ये बसलात!");
        }
    } else {
        // गाडी चालवणे (GTA 5 स्टाईल स्पीड)
        let speedMultiplier = vehicleType === "car" ? 3.5 : 2.8; 
        
        if (keys.w) vehicle.position.z -= moveSpeed * speedMultiplier;
        if (keys.s) vehicle.position.z += moveSpeed * speedMultiplier;
        if (keys.a) vehicle.position.x -= moveSpeed * 1.5;
        if (keys.d) vehicle.position.x += moveSpeed * 1.5;

        // **GTA 5 कॅमेरा व्ह्यू (गाडीच्या मागे एकदम परफेक्ट डिस्टन्सवर)**
        camera.position.set(vehicle.position.x, vehicle.position.y + 4, vehicle.position.z + 10);
        camera.lookAt(vehicle.position.x, vehicle.position.y + 1, vehicle.position.z - 4);
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.onload = init3D;
