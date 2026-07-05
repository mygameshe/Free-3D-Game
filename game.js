let scene, camera, renderer;
let player, ground; 
let vehicle = null; 
let vehicleType = ""; 
let isDriving = false; 

// हालचाली आणि फिजिक्स व्हेरिएबल्स
let carSpeed = 0;
let carAngle = 0; 
let playerAngle = 0; 
let maxSpeed = 0.8;
let acceleration = 0.02;
let braking = 0.04;
const friction = 0.01;
const turnSpeed = 0.035;

const keys = { w: false, a: false, s: false, d: false };
let houses = []; 

function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7ec8e3); // सुंदर आकाश

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // --- रिअलिस्टिक लाईटिंग (Real 3D Look) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // सभोवतालचा प्रकाश
    scene.add(ambientLight);
    
    // खऱ्या सूर्यासारखा प्रकाश (Directional Light) यामुळे सावल्या आणि चमक दिसेल
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(40, 80, 30);
    scene.add(sunLight);

    // हिरवे मैदान
    const groundGeo = new THREE.PlaneGeometry(2000, 2000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.9 });
    ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2; 
    scene.add(ground);

    // मोठा हायवे रस्ता
    const roadGeo = new THREE.PlaneGeometry(35, 4000); 
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, -1500);
    scene.add(road);

    // पांढऱ्या लाईन्स
    for(let i = 0; i > -3500; i -= 45) {
        const lineGeo = new THREE.PlaneGeometry(0.7, 15);
        const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, 0.03, i);
        scene.add(line);
    }

    createCityHouses();

    // --- ३D मानवी पुतळा (Player) ---
    player = new THREE.Group();
    
    const torsoGeo = new THREE.BoxGeometry(0.9, 1.2, 0.5);
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.7 }); 
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.4;
    player.add(torso);

    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x8d5524 }); 
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.1;
    player.add(head);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x1565c0 }); 
    const leftLegGeo = new THREE.BoxGeometry(0.3, 0.9, 0.3);
    const leftLeg = new THREE.Mesh(leftLegGeo, legMat);
    leftLeg.position.set(-0.25, 0.45, 0);
    player.add(leftLeg);

    const rightLeg = leftLeg.clone();
    rightLeg.position.set(0.25, 0.45, 0);
    player.add(rightLeg);

    const armMat = new THREE.MeshStandardMaterial({ color: 0x8d5524 });
    const armGeo = new THREE.BoxGeometry(0.25, 0.9, 0.25);
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.6, 1.4, 0);
    player.add(leftArm);

    const rightArm = leftArm.clone();
    rightArm.position.set(0.6, 1.4, 0);
    player.add(rightArm);

    player.position.set(0, 0, 0); 
    scene.add(player);

    setupMobileControls();
    window.addEventListener('resize', onWindowResize);
    animate();
}

function createCityHouses() {
    const houseColors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x1a535c, 0xf7fff7, 0xa8dadc];
    for (let i = -50; i > -3500; i -= 70) {
        createSingleHouse(-38, i, houseColors[Math.floor(Math.random() * houseColors.length)]);
        createSingleHouse(38, i, houseColors[Math.floor(Math.random() * houseColors.length)]);
    }
}

function createSingleHouse(x, z, colorHex) {
    const houseGroup = new THREE.Group();
    const hHeight = 12 + Math.random() * 12; 
    
    const bodyGeo = new THREE.BoxGeometry(18, hHeight, 18);
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = hHeight / 2;
    houseGroup.add(body);

    const roofGeo = new THREE.ConeGeometry(14, 6, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb10000 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = hHeight + 3;
    roof.rotation.y = Math.PI / 4;
    houseGroup.add(roof);

    houseGroup.position.set(x, 0, z);
    scene.add(houseGroup);
    houses.push({ x: x, z: z, radius: 11 }); 
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
        player.position.set(vehicle.position.x - 3, 0, vehicle.position.z);
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
    if (code === '9999') {
        spawnVehicle("sports_bike");
        toggleMobilePhone(); 
    } else if (code === '8888') {
        spawnVehicle("bullet_bike");
        toggleMobilePhone();
    } else if (code === '1111') {
        spawnVehicle("sports_car");
        toggleMobilePhone();
    } else if (code === '2222') {
        spawnVehicle("thar_car");
        toggleMobilePhone();
    } else {
        alert("चिटकोड्स:\n9999 = स्पोर्ट्स बाईक\n8888 = बुलेट बाईक\n1111 = स्पोर्ट्स कार\n2222 = थार कार");
    }
    document.getElementById('cheat-input').value = ''; 
}

// ===================================================
// ** एआय अल्टीमेट रिअलिस्टिक व्हेइकल डिझाईन (Real Parts) **
// ===================================================
function spawnVehicle(type) {
    if (vehicle) scene.remove(vehicle); 
    vehicleType = type;
    carSpeed = 0;
    carAngle = 0;

    vehicle = new THREE.Group();
    
    // खऱ्या टायरसारखे डिझाईन (काळे जाड चाक)
    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 24);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    if (type === "sports_bike" || type === "bullet_bike") {
        maxSpeed = type === "sports_bike" ? 0.95 : 0.8;
        const bikeColor = type === "sports_bike" ? 0x0041c2 : 0x222222; // निळी किंवा काळी बुलेट

        // १. बाईकची मुख्य टाकी (Fuel Tank & Seat)
        const tankGeo = new THREE.BoxGeometry(0.35, 0.5, 1.2);
        const tankMat = new THREE.MeshStandardMaterial({ color: bikeColor, metalness: 0.5, roughness: 0.2 });
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(0, 0.75, 0);
        vehicle.add(tank);

        // २. बाईकचे इंजिन एरिया (Engine Block - चांदी सारखा मेटल रंग)
        const engineGeo = new THREE.BoxGeometry(0.3, 0.4, 0.6);
        const engineMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 });
        const engine = new THREE.Mesh(engineGeo, engineMat);
        engine.position.set(0, 0.4, -0.1);
        vehicle.add(engine);

        // ३. पुढचे हँडल (Handlebars)
        const handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(0, 1.1, -0.7);
        vehicle.add(handle);

        // ४. रिअल दोन चाके (Front and Back Wheels)
        const fWheel = new THREE.Mesh(wheelGeo, wheelMat); fWheel.rotation.z = Math.PI/2; fWheel.position.set(0, 0.5, -0.9); vehicle.add(fWheel);
        const bWheel = fWheel.clone(); bWheel.position.set(0, 0.5, 0.9); vehicle.add(bWheel);

    } else if (type === "sports_car" || type === "thar_car") {
        const carColor = type === "sports_car" ? 0xffb703 : 0xd90429;
        maxSpeed = type === "sports_car" ? 0.85 : 0.7;

        // कारची मुख्य चेसिस (Chassis)
        const bodyGeo = type === "sports_car" ? new THREE.BoxGeometry(2.2, 0.6, 4.5) : new THREE.BoxGeometry(2.4, 1.1, 4.2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: carColor, metalness: 0.4, roughness: 0.2 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = type === "sports_car" ? 0.5 : 0.8;
        vehicle.add(body);

        // कारच्या काचा आणि केबिन (Windows/Cabin)
        const cabinGeo = type === "sports_car" ? new THREE.BoxGeometry(1.8, 0.6, 2.2) : new THREE.BoxGeometry(2.3, 0.8, 2.2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, type === "sports_car" ? 1.1 : 1.75, type === "sports_car" ? -0.2 : 0.4);
        vehicle.add(cabin);

        // ४ चाके (थारसाठी मोठी चाके)
        const cWheelGeo = type === "thar_car" ? new THREE.CylinderGeometry(0.65, 0.65, 0.6, 24) : wheelGeo;
        const wY = type === "thar_car" ? 0.65 : 0.5;
        const wX = type === "thar_car" ? 1.3 : 1.2;

        const w1 = new THREE.Mesh(cWheelGeo, wheelMat); w1.rotation.z = Math.PI/2; w1.position.set(wX, wY, -1.4); vehicle.add(w1);
        const w2 = w1.clone(); w2.position.set(-wX, wY, -1.4); vehicle.add(w2);
        const w3 = w1.clone(); w3.position.set(wX, wY, 1.4); vehicle.add(w3);
        const w4 = w1.clone(); w4.position.set(-wX, wY, 1.4); vehicle.add(w4);
    }

    vehicle.position.set(player.position.x, 0, player.position.z - 5);
    scene.add(vehicle);
    isDriving = false; 
    player.visible = true;
}

function checkCollision(nextX, nextZ) {
    for (let i = 0; i < houses.length; i++) {
        let h = houses[i];
        let dx = nextX - h.x;
        let dz = nextZ - h.z;
        let distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < h.radius) return true; 
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
            carSpeed = -carSpeed * 0.3; 
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
