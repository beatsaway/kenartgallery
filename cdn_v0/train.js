import * as THREE from 'three';

export function createMinecart() {
    const cartGroup = new THREE.Group();
    // Cart base
    const baseGeometry = new THREE.BoxGeometry(2, 0.5, 2);
    const baseMaterial = new THREE.MeshBasicMaterial({
        color: 0x8b5a2b // brown
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.5;
    cartGroup.add(base);
    // Cart sides
    const sideGeometry = new THREE.BoxGeometry(0.1, 0.5, 2);
    const sideMaterial = new THREE.MeshBasicMaterial({
        color: 0x8b4513 // darker brown
    });
    const leftSide = new THREE.Mesh(sideGeometry, sideMaterial);
    leftSide.position.set(-0.95, 1, 0);
    cartGroup.add(leftSide);
    const rightSide = new THREE.Mesh(sideGeometry, sideMaterial);
    rightSide.position.set(0.95, 1, 0);
    cartGroup.add(rightSide);
    // Cart wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
    const wheelMaterial = new THREE.MeshBasicMaterial({
        color: 0x5c4033 // dark brown
    });
    const wheelPositions = [
        [-0.8, 0.3, -0.8],
        [0.8, 0.3, -0.8],
        [-0.8, 0.3, 0.8],
        [0.8, 0.3, 0.8]
    ];
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(...pos);
        wheel.name = 'wheel';
        cartGroup.add(wheel);
    });
    return cartGroup;
}

export function createRailwaySystem(scene, camera, trainSystem) {
    // Parameters for rail placement
    const railSeparation = 1.2; // Distance between the two rails
    const railWidth = 0.15;     // Width of each rail
    const railHeight = 0.1;
    const railLength = scene.userData.galleryLength;
    // Create left rail
    const leftRailGeometry = new THREE.BoxGeometry(railWidth, railHeight, railLength);
    const leftRailMaterial = new THREE.MeshBasicMaterial({
        color: 0x8b5a2b, // brown
        side: THREE.DoubleSide
    });
    const leftRail = new THREE.Mesh(leftRailGeometry, leftRailMaterial);
    leftRail.position.set(-railSeparation / 2, 0.05, 0);
    scene.add(leftRail);
    // Create right rail
    const rightRailGeometry = new THREE.BoxGeometry(railWidth, railHeight, railLength);
    const rightRailMaterial = new THREE.MeshBasicMaterial({
        color: 0x8b5a2b, // brown
        side: THREE.DoubleSide
    });
    const rightRail = new THREE.Mesh(rightRailGeometry, rightRailMaterial);
    rightRail.position.set(railSeparation / 2, 0.05, 0);
    scene.add(rightRail);
    // Create railway sleepers
    const sleeperGeometry = new THREE.BoxGeometry(2, 0.1, 0.4);
    const sleeperMaterial = new THREE.MeshBasicMaterial({
        color: 0x8b4513, // darker brown
        side: THREE.DoubleSide
    });
    for (let z = -scene.userData.galleryLength/2 + 2; z < scene.userData.galleryLength/2 - 2; z += 2) {
        const sleeper = new THREE.Mesh(sleeperGeometry, sleeperMaterial);
        sleeper.position.set(0, 0.02, z);
        scene.add(sleeper);
    }
    // Create minecart train with 20 carts
    const cartSpacing = 2.5;
    for (let i = 0; i < 20; i++) {
        const cart = createMinecart();
        cart.position.z = -scene.userData.galleryLength/2 + 5 + (i * cartSpacing);
        trainSystem.carts.push(cart);
        scene.add(cart);
    }
    // Update function for train movement
    trainSystem.update = function() {
        trainSystem.carts.forEach((cart, index) => {
            cart.position.z += trainSystem.speed;
            const galleryLength = scene.userData.galleryLength;
            const margin = 1;
            if (cart.position.z > galleryLength/2 + margin) {
                cart.position.z = -galleryLength/2 - margin;
            } else if (cart.position.z < -galleryLength/2 - margin) {
                cart.position.z = galleryLength/2 + margin;
            }
            cart.children.slice(3).forEach(wheel => {
                wheel.rotation.x += 0.1 * trainSystem.speed;
            });
            if (camera.userData.onTrain === cart) {
                camera.position.x = cart.position.x;
                camera.position.y = cart.position.y + 1.5;
                camera.position.z = cart.position.z;
            }
        });
    };
} 