let scene, camera, renderer;
let player, ground; 
let vehicle = null; 
let vehicleType = ""; 
let isDriving = false; 

// मूव्हमेंट आणि रिअलिस्टिक फिजिक्स
let carSpeed = 0;
let carAngle = 0; 
let playerAngle = 0; 
let maxSpeed = 0.8;
let acceleration = 0.02;
let braking = 0.04;
const friction = 0.015;
const turnSpeed = 0.038;

const keys = { w: false, a: false, s: false, d: false };
let colliders = []; // घरे आणि झाडांच्या कोलिजनसाठी

function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0e0ef); // उबदार सकाळचे आकाश

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // **सावल्या (Shadows) चालू केल्या**
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // --- रिअलिस्टिक लाईटिंग आणि शॅडोज ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(50, 120, 40);
    sunLight.castShadow = true; // सूर्यप्रकाशामुळे सावली पडणार
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    
    // सावलीचा एरिया ठरवला
    let d = 100;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // हिरवे मैदान (जमीन)
    const groundGeo = new THREE.PlaneGeometry(2000, 2000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x419832, roughness: 0.9 });
    ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2; 
    ground.receiveShadow = true; // जमिनीवर सावली दिसणार
    scene.add(ground);

    // मोठा हायवे रस्ता (डांबरी रस्ता)
    const roadGeo = new THREE.PlaneGeometry(32, 4000); 
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x282828, roughness: 0.6 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, -1500);
    road.receiveShadow = true;
    scene.add(road);

    // ** ३D शहराचे फुटपाथ (Sidewalks) **
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

    // शहर, घरे आणि झाडे तयार करणे
    createRealisticCity();

    // --- ३D मानवी कॅरेक्टर (Player) ---
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
    window.addEventListener('resize', onWindowResize);
    animate();
}

// --- ३D घरे आणि झाडे रस्त्याच्या कडेला जोडणे ---
function createRealisticCity() {
    const houseColors = [0xde5d4e, 0x3b7a57, 0xf4a261, 0x2a9d8f, 0xe9c46a, 0xa8dadc];
    
    for (let i = -60; i > -3500; i -= 80) {
        // घरे (डावी आणि उजवी बाजू)
        create3DHouse(-42, i, houseColors[Math.floor(Math.random() * houseColors.length)]);
        create3DHouse(42, i, houseColors[Math.floor(Math.random() * houseColors.length)]);

        // ** खऱ्या आकाराची ३D झाडे (Trees) फुटपाथच्या शेजारी **
        create3DTree(-21, i + 30);
        create3DTree(21, i + 30);
    }
}

function create3DHouse(x, z, colorHex) {
    const houseGroup = new THREE.Group();
    const hHeight = 14 + Math.random() * 14; 
    
    // घराची भिंत
    const bodyGeo = new THREE.BoxGeometry(20, hHeight, 20);
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = hHeight / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    houseGroup.add(body);

    // इमारतीच्या खिडक्या (Windows)
    const winGeo = new THREE.PlaneGeometry(1.5, 2);
    const winMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
    for (let y = 3; y < hHeight - 2; y += 4) {
        const windowMesh = new THREE.Mesh(winGeo, winMat);
        windowMesh.position.set(x > 0 ? -10.01 : 10.01, y, 0);
        windowMesh.rotation.y = x > 0 ? -Math.PI/2 : Math.PI/2;
        houseGroup.add(windowMesh);
    }

    // छप्पर (Roof)
    const roofGeo = new THREE.ConeGeometry(15, 7, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x900c3f, roughness: 0.4 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = hHeight + 3.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    houseGroup.add(roof);

    houseGroup.position.set(x, 0, z);
    scene.add(houseGroup);
    colliders.push({ x: x, z: z, radius: 12 }); 
}

function create3DTree(x, z) {
    const treeGroup = new THREE.Group();

    // झाडाचे लाकडी खोड (Trunk)
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // झाडाची हिरवी पाने (Foliage)
    const leavesGeo = new THREE.SphereGeometry(1.8, 8, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1b4d3e, roughness: 0.8 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 4.5;
    leaves.castShadow = true;
    treeGroup.add(leaves);

    treeGroup.position.set(x, 0, z);
    scene.add(treeGroup);
    colliders.push({ x: x, z: z, radius: 2 }); // झाडाला पण धडक होईल
}

function toggleMobilePhone() {
    const phone = document.getElementById('phone-container');
    phone.classList.toggle('hidden');
}

function toggleVehicleDrive() {
    if (!vehicle) {
        alert("पहिले फोन उघडून गाडी स्पॉन करा!");
        return;
    }

    if (isDriving) {
        isDriving = false;
        player.visible = true;
        player.position.set(vehicle.position.x - 3.5, 0, vehicle.position.z);
        carSpeed = 0;
    } else {
        let distance = player.position.distanceTo(vehicle.position);
        if (distance < 6) {
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
    else alert("कोड: बाईक=9999 | थार=2222");
    
    toggleMobilePhone();
    document.getElementById('cheat-input').value = ''; 
}

// --- रिअलिस्टिक ३D गाड्यांचे डिझाईन ---
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
        const bikeColor = type === "sports_bike" ? 0x0041c2 : 0x222222;

        const tankGeo = new THREE.BoxGeometry(0.35, 0.5, 1.2);
        const tankMat = new THREE.MeshStandardMaterial({ color: bikeColor, metalness: 0.6, roughness: 0.2 });
        const tank = new THREE.Mesh(tankGeo, tankMat); tank.position.y = 0.75; tank.castShadow = true; vehicle.add(tank);

        const engineGeo = new THREE.BoxGeometry(0.3, 0.4, 0.6);
        const engineMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
        const engine = new THREE.Mesh(engineGeo, engineMat); engine.position.set(0, 0.4, -0.1); engine.castShadow = true; vehicle.add(engine);

        const handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const handle = new THREE.Mesh(handleGeo, handleMat); handle.rotation.z = Math.PI / 2; handle.position.set(0, 1.1, -0.7); vehicle.add(handle);

        const fWheel = new THREE.Mesh(wheelGeo, wheelMat); fWheel.rotation.z = Math.PI/2; fWheel.position.set(0, 0.5, -0.9); fWheel.castShadow = true; vehicle.add(fWheel);
        const bWheel = fWheel.clone(); bWheel.position.set(0, 0.5, 0.9); vehicle.add(bWheel);

    } else {
        const carColor = type === "sports_car" ? 0xffb703 : 0xd90429;
        maxSpeed = type === "sports_car" ? 0.85 : 0.7;

        const bodyGeo = type === "sports_car" ? new THREE.BoxGeometry(2.2, 0.6, 4.5) : new THREE.BoxGeometry(2.4, 1.1, 4.2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: carColor, metalness: 0.5, roughness: 0.2 });
        const body = new THREE.Mesh(bodyGeo, bodyMat); body.position.y = type === "sports_car" ? 0.5 : 0.8; body.castShadow = true; vehicle.add(body);

        const cabinGeo = type === "sports_car" ? new THREE.BoxGeometry(1.8, 0.6, 2.2) : new THREE.BoxGeometry(2.3, 0.8, 2.2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat); cabin.position.set(0, type === "sports_car" ? 1.1 : 1.75, type === "sports_car" ? -0.2 : 0.4); cabin.castShadow = true; vehicle.add(cabin);

        const cWheelGeo = type === "thar_car" ? new THREE.CylinderGeometry(0.65, 0.65, 0.6, 24) : wheelGeo;
        const wY = type === "thar_car" ? 0.65 : 0.5;
        const wX = type === "thar_car" ? 1.3 : 1.2;

        const w1 = new THREE.Mesh(cWheelGeo, wheelMat); w1.rotation.z = Math.PI/2; w1.position.set(wX, wY, -1.4); w1.castShadow = true; vehicle.add(w1);
        const w2 = w1.clone(); w2.position.set(-wX, wY, -1.4); vehicle.add(w2);
        const w3 = w1.clone(); w3.position.set(wX, wY, 1.4); vehicle.add(w3);
        const w4 = w1.clone(); w4.position.set(-wX, wY, 1.4); vehicle.add(w4);
    }

    vehicle.position.set(player.position.x, 0, player.position.z - 5);
    scene.add(vehicle);
    isDriving = false; 
    player.visible = true;
}

// --- एआय परफेक्ट कोलिजन डिटेक्शन ---
function checkCollision(nextX, nextZ) {
    for (let i = 0; i < colliders.length; i++) {
        let c = colliders[i];
        let dx = nextX - c.x;
        let dz = nextZ - c.z;
        let distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < c.radius) return true; 
    }
    return false; 
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
    bindControl('btn-left', 'a');
    bindControl('btn-right', 'd');
}

function animate() {
    requestAnimationFrame(animate);
    const pSpeed = 0.16;

    if (!isDriving) {
        if (keys.a) playerAngle += 0.045; 
        if (keys.d) playerAngle -= 0.045; 
        player.rotation.y = playerAngle;

        let nextX = player.position.x;
        let nextZ = player.position.z;

        if (keys.w) {
            nextX -= Math.sin(playerAngle) * pSpeed;
            nextZ -= Math.cos(playerAngle) * pSpeed;
        }
        if (keys.s) {
            nextX += Math.sin(playerAngle) * pSpeed;
            nextZ += Math.cos(playerAngle) * pSpeed;
        }

        if (!checkCollision(nextX, nextZ)) {
            player.position.x = nextX;
            player.position.z = nextZ;
        }

        camera.position.set(
            player.position.x + Math.sin(playerAngle) * 7,
            player.position.y + 4,
            player.position.z + Math.cos(playerAngle) * 7
        );
        camera.lookAt(player.position.x, player.position.y + 1, player.position.z - 2);

    } else if (vehicle) {
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

        if (Math.abs(carSpeed) > 0.05) {
            const currentTurnSpeed = turnSpeed * (carSpeed / maxSpeed);
            if (keys.a) carAngle += currentTurnSpeed;
            if (keys.d) carAngle -= currentTurnSpeed;
        }

        vehicle.rotation.y = carAngle;

        let nextCarX = vehicle.position.x - Math.sin(carAngle) * carSpeed;
        let nextCarZ = vehicle.position.z - Math.cos(carAngle) * carSpeed;

        if (!checkCollision(nextCarX, nextCarZ)) {
            vehicle.position.x = nextCarX;
            vehicle.position.z = nextCarZ;
        } else {
            carSpeed = -carSpeed * 0.35; // धडकल्यावर रिअल बाऊन्स बॅक इफेक्ट
        }

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
            
