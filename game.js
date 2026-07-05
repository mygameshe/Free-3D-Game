let scene, camera, renderer;
let player, ground; 
let vehicle = null; 
let vehicleType = ""; 
let isDriving = false; 

// मूव्हमेंट आणि फिजिक्स व्हेरिएबल्स
let carSpeed = 0;
let carAngle = 0; 
let playerAngle = 0; 
let maxSpeed = 0.8;
const acceleration = 0.02;
const braking = 0.04;
const friction = 0.015;
const turnSpeed = 0.04;

// बटन्स कंट्रोल्स
const keys = { w: false, s: false };

// जॉयस्टिक पोझिशन व्हॅल्यूज (३६० डिग्री हालचालीसाठी)
let joystickX = 0; 

function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0e0ef); 

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; 
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(50, 120, 40);
    sunLight.castShadow = true; 
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // हिरवे मैदान
    const groundGeo = new THREE.PlaneGeometry(2000, 2000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x419832, roughness: 0.9 });
    ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2; 
    ground.receiveShadow = true; 
    scene.add(ground);

    // रस्ता
    const roadGeo = new THREE.PlaneGeometry(32, 4000); 
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x282828, roughness: 0.6 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, -1500);
    road.receiveShadow = true;
    scene.add(road);

    // फुटपाथ
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.8 });
    const leftSidewalkGeo = new THREE.PlaneGeometry(4, 4000);
    const leftSidewalk = new THREE.Mesh(leftSidewalkGeo, sidewalkMat);
    leftSidewalk.rotation.x = -Math.PI / 2;
    leftSidewalk.position.set(-18, 0.03, -1500);
    leftSidewalk.receiveShadow = true;
    scene.add(leftSidewalk);

    const rightSidewalk = leftSidewalk.clone();
    rightSidewalk.position.x = 18;
    scene.add(rightSidewalk);

    // रस्त्यावरील पांढऱ्या लाईन्स
    for(let i = 0; i > -3500; i -= 50) {
        const lineGeo = new THREE.PlaneGeometry(0.6, 12);
        const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, 0.04, i);
        scene.add(line);
    }

    createRealisticCity();

    // --- ३D मानवी कॅरेक्टर ---
    player = new THREE.Group();
    
    const torsoGeo = new THREE.BoxGeometry(0.8, 1.1, 0.45);
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }); 
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    player.add(torso);

    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x8d5524 }); 
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.05;
    head.castShadow = true;
    player.add(head);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x1a237e }); 
    const legGeo = new THREE.BoxGeometry(0.28, 0.85, 0.28);
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.22, 0.42, 0);
    leftLeg.castShadow = true;
    player.add(leftLeg);

    const rightLeg = leftLeg.clone();
    rightLeg.position.set(0.22, 0.42, 0);
    player.add(rightLeg);

    player.position.set(0, 0, 0); 
    scene.add(player);

    setupMobileControls();
    setupJoystick(); // जॉयस्टिक जोडली
    window.addEventListener('resize', onWindowResize);
    animate();
}

function createRealisticCity() {
    const houseColors = [0xde5d4e, 0x3b7a57, 0xf4a261, 0x2a9d8f, 0xe9c46a];
    for (let i = -60; i > -3500; i -= 80) {
        create3DHouse(-42, i, houseColors[Math.floor(Math.random() * houseColors.length)]);
        create3DHouse(42, i, houseColors[Math.floor(Math.random() * houseColors.length)]);
        create3DTree(-21, i + 30);
        create3DTree(21, i + 30);
    }
}

function create3DHouse(x, z, colorHex) {
    const houseGroup = new THREE.Group();
    const hHeight = 14 + Math.random() * 14; 
    const bodyGeo = new THREE.BoxGeometry(20, hHeight, 20);
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = hHeight / 2;
    body.castShadow = true;
    houseGroup.add(body);

    const roofGeo = new THREE.ConeGeometry(15, 7, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x900c3f });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = hHeight + 3.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    houseGroup.add(roof);

    houseGroup.position.set(x, 0, z);
    scene.add(houseGroup);
}

function create3DTree(x, z) {
    const treeGroup = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const leavesGeo = new THREE.SphereGeometry(1.8, 8, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1b4d3e });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 4.5;
    leaves.castShadow = true;
    treeGroup.add(leaves);

    treeGroup.position.set(x, 0, z);
    scene.add(treeGroup);
}

function toggleMobilePhone() {
    const phone = document.getElementById('phone-container');
    phone.classList.toggle('hidden');
}

function toggleVehicleDrive() {
    if (!vehicle) return;
    if (isDriving) {
        isDriving = false;
        player.visible = true;
        player.position.set(vehicle.position.x - 3.5, 0, vehicle.position.z);
        carSpeed = 0;
    } else {
        if (player.position.distanceTo(vehicle.position) < 6) {
            isDriving = true;
            player.visible = false; 
        } else {
            alert("गाडी जवळ जा!");
        }
    }
}

function applyCheatCode() {
    const code = document.getElementById('cheat-input').value;
    if (code === '9999') spawnVehicle("sports_bike");
    else if (code === '8888') spawnVehicle("bullet_bike");
    else if (code === '1111') spawnVehicle("sports_car");
    else if (code === '2222') spawnVehicle("thar_car");
    toggleMobilePhone();
    document.getElementById('cheat-input').value = ''; 
}

function spawnVehicle(type) {
    if (vehicle) scene.remove(vehicle); 
    vehicleType = type;
    carSpeed = 0;
    carAngle = 0;

    vehicle = new THREE.Group();
    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 24);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 });

    if (type === "sports_bike" || type === "bullet_bike") {
        maxSpeed = type === "sports_bike" ? 0.95 : 0.8;
        const bodyGeo = new THREE.BoxGeometry(0.35, 0.5, 1.2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: type === "sports_bike" ? 0x0041c2 : 0x222222 });
        const body = new THREE.Mesh(bodyGeo, bodyMat); body.position.y = 0.75; body.castShadow = true; vehicle.add(body);

        const fWheel = new THREE.Mesh(wheelGeo, wheelMat); fWheel.rotation.z = Math.PI/2; fWheel.position.set(0, 0.5, -0.9); fWheel.castShadow = true; vehicle.add(fWheel);
        const bWheel = fWheel.clone(); bWheel.position.set(0, 0.5, 0.9); vehicle.add(bWheel);
    } else {
        const bodyGeo = type === "sports_car" ? new THREE.BoxGeometry(2.2, 0.6, 4.5) : new THREE.BoxGeometry(2.4, 1.1, 4.2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: type === "sports_car" ? 0xffb703 : 0xd90429 });
        const body = new THREE.Mesh(bodyGeo, bodyMat); body.position.y = type === "sports_car" ? 0.5 : 0.8; body.castShadow = true; vehicle.add(body);

        const cabinGeo = type === "sports_car" ? new THREE.BoxGeometry(1.8, 0.6, 2.2) : new THREE.BoxGeometry(2.3, 0.8, 2.2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat); cabin.position.set(0, type === "sports_car" ? 1.1 : 1.75, type === "sports_car" ? -0.2 : 0.4); cabin.castShadow = true; vehicle.add(cabin);

        const w1 = new THREE.Mesh(wheelGeo, wheelMat); w1.rotation.z = Math.PI/2; w1.position.set(1.2, 0.5, -1.4); w1.castShadow = true; vehicle.add(w1);
        const w2 = w1.clone(); w2.position.set(-1.2, 0.5, -1.4); vehicle.add(w2);
        const w3 = w1.clone(); w3.position.set(1.2, 0.5, 1.4); vehicle.add(w3);
        const w4 = w1.clone(); w4.position.set(-1.2, 0.5, 1.4); vehicle.add(w4);
    }

    vehicle.position.set(player.position.x, 0, player.position.z - 5);
    scene.add(vehicle);
    isDriving = false; 
    player.visible = true;
}

// --- ३D जॉयस्टिक टच कोडींग लॉजिक ---
function setupJoystick() {
    const container = document.getElementById('joystick-container');
    const knob = document.getElementById('joystick-knob');
    if (!container || !knob) return;

    const handleJoystick = (clientX) => {
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        let deltaX = clientX - centerX;
        
        // जॉयस्टिक ५०px च्या बाहेर जाऊ नये म्हणून लिमिट
        const maxDistance = 35;
        deltaX = Math.max(-maxDistance, Math.min(maxDistance, deltaX));

        knob.style.transform = `translateX(${deltaX}px)`;
        joystickX = deltaX / maxDistance; // -१ (डावीकडे) ते +१ (उजवीकडे) व्हॅल्यू
    };

    container.addEventListener('touchstart', (e) => {
        handleJoystick(e.touches[0].clientX);
    });

    container.addEventListener('touchmove', (e) => {
        e.preventDefault();
        handleJoystick(e.touches[0].clientX);
    });

    container.addEventListener('touchend', () => {
        knob.style.transform = 'translate(0px, 0px)';
        joystickX = 0; // बोट काढल्यावर जॉयस्टिक सेंटरमध्ये येईल
    });
}

function setupMobileControls() {
    const bindControl = (btnId, keyProp) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[keyProp] = true; });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[keyProp] = false; });
    };
    bindControl('btn-up', 'w');
    bindControl('btn-down', 's');
}

function animate() {
    requestAnimationFrame(animate);
    const pSpeed = 0.16;

    if (!isDriving) {
        // १. जॉयस्टिकने प्लेयर वळवणे
        if (Math.abs(joystickX) > 0.1) {
            playerAngle -= joystickX * 0.05;
        }
        player.rotation.y = playerAngle;

        if (keys.w) {
            player.position.x -= Math.sin(playerAngle) * pSpeed;
            player.position.z -= Math.cos(playerAngle) * pSpeed;
        }
        if (keys.s) {
            player.position.x += Math.sin(playerAngle) * pSpeed;
            player.position.z += Math.cos(playerAngle) * pSpeed;
        }

        camera.position.set(
            player.position.x + Math.sin(playerAngle) * 7,
            player.position.y + 4,
            player.position.z + Math.cos(playerAngle) * 7
        );
        camera.lookAt(player.position.x, player.position.y + 1, player.position.z - 2);

    } else if (vehicle) {
        // २. गाडी चालवणे
        if (keys.w) {
            carSpeed += acceleration;
            if (carSpeed > maxSpeed) carSpeed = maxSpeed;
        } else if (keys.s) {
            carSpeed -= braking;
            if (carSpeed < -maxSpeed/2) carSpeed = -maxSpeed/2;
        } else {
            if (carSpeed > 0) carSpeed -= friction;
            if (carSpeed < 0) carSpeed += friction;
            if (Math.abs(carSpeed) < 0.01) carSpeed = 0;
        }

        // जॉयस्टिकने गाडी वळवणे
        if (Math.abs(carSpeed) > 0.05 && Math.abs(joystickX) > 0.1) {
            carAngle -= joystickX * turnSpeed * (carSpeed / maxSpeed);
        }

        vehicle.rotation.y = carAngle;
        vehicle.position.x -= Math.sin(carAngle) * carSpeed;
        vehicle.position.z -= Math.cos(carAngle) * carSpeed;

        const camDistance = 12;
        const camHeight = 5;
        camera.position.set(
            vehicle.position.x + Math.sin(carAngle) * camDistance,
            vehicle.position.y + camHeight,
            vehicle.position.z + Math.cos(carAngle) * camDistance
        );
        camera.lookAt(vehicle.position.x - Math.sin(carAngle) * 5, vehicle.position.y + 1, vehicle.position.z - Math.cos(carAngle) * 5);
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.onload = init3D;
