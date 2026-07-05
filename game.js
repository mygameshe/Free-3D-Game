let scene, camera, renderer;
let player, ground;
let vehicle = null; 
let vehicleType = ""; 
let isDriving = false; 

// गाडीची मूव्हमेंट आणि फिजिक्स व्हेरिएबल्स
let carSpeed = 0;
let carAngle = 0; // गाडीचे वळण ट्रॅक करण्यासाठी
const maxSpeed = 0.8;
const acceleration = 0.02;
const braking = 0.04;
const friction = 0.01;
const turnSpeed = 0.03;

const keys = { w: false, a: false, s: false, d: false };
let houses = []; // सर्व घरांचे मॉडेल्स साठवण्यासाठी

function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7ec8e3); // सुंदर निळं आकाश

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // लाईट्स (सावल्या आणि ३D लुक येण्यासाठी)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(20, 50, 20);
    scene.add(dirLight);

    // मोठे हिरवे मैदान
    const groundGeo = new THREE.PlaneGeometry(2000, 2000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.9 });
    ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2; 
    scene.add(ground);

    // **अनंत रस्ता (खूप लांब रस्ता बनवला जो संपणार नाही)**
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

    // **३D घरे आणि इमारती जोडणे (Create Houses along the road)**
    createCityHouses();

    // सुरुवातीचा प्लेयर (लाल बॉक्स)
    const playerGeo = new THREE.BoxGeometry(1, 2, 1);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0xd90429 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(0, 1, 0); 
    scene.add(player);

    setupMobileControls();
    window.addEventListener('resize', onWindowResize);
    animate();
}

// --- ३D घरे तयार करण्याचे फंक्शन ---
function createCityHouses() {
    const houseColors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x1a535c, 0xf7fff7, 0xa8dadc];
    
    for (let i = -50; i > -3500; i -= 60) {
        // डाव्या बाजूची घरे
        createSingleHouse(-35, i, houseColors[Math.floor(Math.random() * houseColors.length)]);
        // उजव्या बाजूची घरे
        createSingleHouse(35, i, houseColors[Math.floor(Math.random() * houseColors.length)]);
    }
}

function createSingleHouse(x, z, colorHex) {
    const houseGroup = new THREE.Group();

    // घराची मुख्य बिल्डिंग (Base)
    const hHeight = 8 + Math.random() * 12; // वेगवेगळ्या उंचीच्या इमारती
    const bodyGeo = new THREE.BoxGeometry(15, hHeight, 15);
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = hHeight / 2;
    houseGroup.add(body);

    // घराचे छप्पर (Roof - लाल रंगाचे त्रिकोण/Cone)
    const roofGeo = new THREE.ConeGeometry(12, 5, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb10000 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = hHeight + 2.5;
    roof.rotation.y = Math.PI / 4; // छप्पर नीट सेट करण्यासाठी
    houseGroup.add(roof);

    houseGroup.position.set(x, 0, z);
    scene.add(houseGroup);
    houses.push(houseGroup);
}

function toggleMobilePhone() {
    const phone = document.getElementById('phone-container');
    phone.classList.toggle('hidden');
}

function applyCheatCode() {
    const code = document.getElementById('cheat-input').value;
    if (code === '9999') {
        alert("बाईक हजर आहे!");
        spawnVehicle("bike");
        toggleMobilePhone(); 
    } else if (code === '1111') {
        alert("स्पोर्ट्स कार हजर आहे!");
        spawnVehicle("car");
        toggleMobilePhone();
    } else {
        alert("कोड: बाईक=9999 | कार=1111");
    }
    document.getElementById('cheat-input').value = ''; 
}

// --- रिअलिस्टिक चाके असलेली गाडी बनवणे ---
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
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0041c2, metalness: 0.3 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        vehicle.add(body);

        const fWheel = new THREE.Mesh(wheelGeo, wheelMat); fWheel.rotation.z = Math.PI/2; fWheel.position.set(0, 0.5, -1); vehicle.add(fWheel);
        const bWheel = fWheel.clone(); bWheel.position.set(0, 0.5, 1); vehicle.add(bWheel);
    } else {
        // कार बॉडी
        const bodyGeo = new THREE.BoxGeometry(2.2, 0.8, 4.5);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.2, roughness: 0.2 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        vehicle.add(body);

        // कार केबिन (काच)
        const cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2.2);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.1 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(0, 1.35, -0.2);
        vehicle.add(cabin);

        // ४ चाके
        const w1 = new THREE.Mesh(wheelGeo, wheelMat); w1.rotation.z = Math.PI/2; w1.position.set(1.2, 0.5, -1.4); vehicle.add(w1);
        const w2 = w1.clone(); w2.position.set(-1.2, 0.5, -1.4); vehicle.add(w2);
        const w3 = w1.clone(); w3.position.set(1.2, 0.5, 1.4); vehicle.add(w3);
        const w4 = w1.clone(); w4.position.set(-1.2, 0.5, 1.4); vehicle.add(w4);
    }

    vehicle.position.set(player.position.x, 0, player.position.z - 5);
    scene.add(vehicle);
    isDriving = true; // थेट गाडीत बसवा
    player.visible = false;
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

// --- मुख्य गेम फिजिक्स लूप ---
function animate() {
    requestAnimationFrame(animate);

    if (!isDriving) {
        // साधी प्लेयर मूव्हमेंट
        const pSpeed = 0.2;
        if (keys.w) player.position.z -= pSpeed;
        if (keys.s) player.position.z += pSpeed;
        if (keys.a) player.position.x -= pSpeed;
        if (keys.d) player.position.x += pSpeed;

        camera.position.set(player.position.x, player.position.y + 4, player.position.z + 8);
        camera.lookAt(player.position.x, player.position.y, player.position.z);
    } else if (vehicle) {
        // --- खऱ्या कारसारखे टर्निंग आणि फिजिक्स लॉजिक ---
        
        // १. रेस आणि ब्रेक (Acceleration & Braking)
        if (keys.w) {
            carSpeed += acceleration;
            if (carSpeed > maxSpeed) carSpeed = maxSpeed;
        } else if (keys.s) {
            carSpeed -= braking;
            if (carSpeed < -maxSpeed/2) carSpeed = -maxSpeed/2; // रिव्हर्स स्पीड कमी असेल
        } else {
            // जेव्हा बटन सोडाल तेव्हा गाडी हळूहळू थांबणार (Friction)
            if (carSpeed > 0) carSpeed -= friction;
            if (carSpeed < 0) carSpeed += friction;
            if (Math.abs(carSpeed) < 0.01) carSpeed = 0;
        }

        // २. रिअलिस्टिक वळण (Steering Rotation)
        // गाडी धावत असतानाच वळली पाहिजे
        if (Math.abs(carSpeed) > 0.05) {
            const currentTurnSpeed = turnSpeed * (carSpeed / maxSpeed); // वेगावर वळण अवलंबून असेल
            if (keys.a) carAngle += currentTurnSpeed; // डावीकडे वळण
            if (keys.d) carAngle -= currentTurnSpeed; // उजव्या बाजूला वळण
        }

        // ३. पोझिशन आणि रोटेशन अपडेट करणे
        vehicle.rotation.y = carAngle; // गाडीचे तोंड फिरवले
        
        // मॅथ्स वापरून गाडी ज्या दिशेला तोंड आहे, तिथेच पुढे ढकलणे
        vehicle.position.x -= Math.sin(carAngle) * carSpeed;
        vehicle.position.z -= Math.cos(carAngle) * carSpeed;

        // ४. GTA 5 सारखा स्मूथ कॅमेरा फॉलो व्ह्यू
        // कॅमेरा गाडीच्या मागे रोटेशननुसार फिरेल
        const camDistance = 12;
        const camHeight = 5;
        
        camera.position.x = vehicle.position.x + Math.sin(carAngle) * camDistance;
        camera.position.z = vehicle.position.z + Math.cos(carAngle) * camDistance;
        camera.position.y = vehicle.position.y + camHeight;
        
        // कॅमेरा नेहमी गाडीच्या किंचित समोर पाहेल
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
