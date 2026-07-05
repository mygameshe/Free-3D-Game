let scene, camera, renderer;
let player, ground; // player आता एक ग्रुप असेल ज्यात डोके, हात, पाय असतील
let vehicle = null; 
let vehicleType = ""; 
let isDriving = false; 

// मूव्हमेंट फिजिक्स
let carSpeed = 0;
let carAngle = 0; 
let playerAngle = 0; // प्लेयरचे स्वतःचे वळण
const maxSpeed = 0.8;
const acceleration = 0.02;
const braking = 0.04;
const friction = 0.01;
const turnSpeed = 0.03;

const keys = { w: false, a: false, s: false, d: false };
let houses = []; 

function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7ec8e3); 

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(20, 50, 20);
    scene.add(dirLight);

    // हिरवे मैदान
    const groundGeo = new THREE.PlaneGeometry(2000, 2000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.9 });
    ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2; 
    scene.add(ground);

    // रस्ता
    const roadGeo = new THREE.PlaneGeometry(30, 4000); 
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, -1500);
    scene.add(road);

    // रस्त्यावरील पांढऱ्या लाईन्स
    for(let i = 0; i > -3500; i -= 40) {
        const lineGeo = new THREE.PlaneGeometry(0.6, 15);
        const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, 0.03, i);
        scene.add(line);
    }

    createCityHouses();

    // ==========================================
    // ** ३D मानवी कॅरेक्टर तयार करणे (CJ सारखा पुतळा) **
    // ==========================================
    player = new THREE.Group();

    // १. धड (Body/Torso - पांढरी बनियान स्टाईल)
    const torsoGeo = new THREE.BoxGeometry(0.9, 1.2, 0.5);
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.7 }); // पांढरा
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.4;
    player.add(torso);

    // २. डोके (Head - स्किन Color)
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x8d5524 }); // ब्राउन स्किन टोन
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.1;
    player.add(head);

    // ३. पाय (Legs - निळी जीन्स स्टाईल)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1565c0 }); // ब्लू जीन्स रंग
    const leftLegGeo = new THREE.BoxGeometry(0.3, 0.9, 0.3);
    
    const leftLeg = new THREE.Mesh(leftLegGeo, legMat);
    leftLeg.position.set(-0.25, 0.45, 0);
    player.add(leftLeg);

    const rightLeg = leftLeg.clone();
    rightLeg.position.set(0.25, 0.45, 0);
    player.add(rightLeg);

    // ४. हात (Arms)
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
    for (let i = -50; i > -3500; i -= 60) {
        createSingleHouse(-35, i, houseColors[Math.floor(Math.random() * houseColors.length)]);
        createSingleHouse(35, i, houseColors[Math.floor(Math.random() * houseColors.length)]);
    }
}

function createSingleHouse(x, z, colorHex) {
    const houseGroup = new THREE.Group();
    const hHeight = 8 + Math.random() * 12;
    const bodyGeo = new THREE.BoxGeometry(15, hHeight, 15);
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = hHeight / 2;
    houseGroup.add(body);

    const roofGeo = new THREE.ConeGeometry(12, 5, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb10000 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = hHeight + 2.5;
    roof.rotation.y = Math.PI / 4;
    houseGroup.add(roof);

    houseGroup.position.set(x, 0, z);
    scene.add(houseGroup);
    houses.push(houseGroup);
}

function toggleMobilePhone() {
    const phone = document.getElementById('phone-container');
    phone.classList.toggle('hidden');
}

// ** गाडीत बसणे / गाडीतून उतरण्याचे लॉजिक **
function toggleVehicleDrive() {
    if (!vehicle) return;

    if (isDriving) {
        // गाडीतून बाहेर उतरणे
        isDriving = false;
        player.visible = true;
        // कॅरेक्टर गाडीच्या डाव्या बाजूला उतरेल
        player.position.set(vehicle.position.x - 3, 0, vehicle.position.z);
        carSpeed = 0;
    } else {
        // जर कॅरेक्टर गाडीच्या जवळ असेल तरच आत बसेल
        if (player.position.distanceTo(vehicle.position) < 4) {
            isDriving = true;
            player.visible = false; // गाडी चालवताना कॅरेक्टर लपवला
        } else {
            alert("गाडी खूप लांब आहे! जवळ जा.");
        }
    }
}

function applyCheatCode() {
    const code = document.getElementById('cheat-input').value;
    if (code === '9999') {
        spawnVehicle("bike");
        toggleMobilePhone(); 
    } else if (code === '1111') {
        spawnVehicle("car");
        toggleMobilePhone();
    } else {
        alert("कोड: बाईक=9999 | कार=1111");
    }
    document.getElementById('cheat-input').value = ''; 
}

function spawnVehicle(type) {
    if (vehicle) scene.remove(vehicle); 
    vehicleType = type;
    carSpeed = 0;
    carAngle = 0;

    vehicle = new THREE.Group();
    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.5, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });

    if (type === "bike") {
        const bodyGeo = new THREE.BoxGeometry(0.5, 1, 2.2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0041c2 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        vehicle.add(body);

        const fWheel = new THREE.Mesh(wheelGeo, wheelMat); fWheel.rotation.z = Math.PI/2; fWheel.position.set(0, 0.5, -1); vehicle.add(fWheel);
        const bWheel = fWheel.clone(); bWheel.position.set(0, 0.5, 1); vehicle.add(bWheel);
    } else {
        const bodyGeo = new THREE.BoxGeometry(2.2, 0.8, 4.5);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffb703 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        vehicle.add(body);

        const cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2.2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.35, -0.2);
        vehicle.add(cabin);

        const w1 = new THREE.Mesh(wheelGeo, wheelMat); w1.rotation.z = Math.PI/2; w1.position.set(1.2, 0.5, -1.4); vehicle.add(w1);
        const w2 = w1.clone(); w2.position.set(-1.2, 0.5, -1.4); vehicle.add(w2);
        const w3 = w1.clone(); w3.position.set(1.1, 0.5, 1.4); vehicle.add(w3);
        const w4 = w1.clone(); w4.position.set(-1.2, 0.5, 1.4); vehicle.add(w4);
    }

    // गाडी प्लेयरच्या समोर स्पॉन होईल, प्लेयर बाहेरच उभा राहील
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
    const pSpeed = 0.15;

    if (!isDriving) {
        // ==========================================
        // ** १. पायाने चालतानाचे कॅरेक्टर लॉजिक **
        // ==========================================
        if (keys.a) playerAngle += 0.04; // डावीकडे वळणे
        if (keys.d) playerAngle -= 0.04; // उजवीकडे वळणे
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
        // ==========================================
        // ** २. गाडी चालवतानाचे लॉजिक **
        // ==========================================
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
            
