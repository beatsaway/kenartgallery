function createFloor(scene) {
    const floorGeometry = new THREE.PlaneGeometry(scene.userData.galleryWidth, scene.userData.galleryLength);
    const floorMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x4caf50, // meadow green
        side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
}

function createWalls(scene) {
    const wallMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
    });
    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(scene.userData.galleryWidth, scene.userData.galleryHeight),
        wallMaterial
    );
    backWall.position.set(0, scene.userData.galleryHeight/2, -scene.userData.galleryLength/2);
    scene.add(backWall);
    // Side walls
    const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(scene.userData.galleryLength, scene.userData.galleryHeight),
        wallMaterial
    );
    leftWall.position.x = -scene.userData.galleryWidth/2;
    leftWall.position.y = scene.userData.galleryHeight/2;
    leftWall.rotation.y = Math.PI/2;
    scene.add(leftWall);
    const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(scene.userData.galleryLength, scene.userData.galleryHeight),
        wallMaterial
    );
    rightWall.position.x = scene.userData.galleryWidth/2;
    rightWall.position.y = scene.userData.galleryHeight/2;
    rightWall.rotation.y = -Math.PI/2;
    scene.add(rightWall);
    // Front wall
    const frontWall = new THREE.Mesh(
        new THREE.PlaneGeometry(scene.userData.galleryWidth, scene.userData.galleryHeight),
        wallMaterial
    );
    frontWall.position.set(0, scene.userData.galleryHeight/2, scene.userData.galleryLength/2);
    scene.add(frontWall);
}

function createCeiling(scene) {
    const ceilingGeometry = new THREE.PlaneGeometry(scene.userData.galleryWidth, scene.userData.galleryLength);
    const ceilingMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = scene.userData.galleryHeight;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);
}

function createGallery(scene) {
    createFloor(scene);
    createCeiling(scene);
    createWalls(scene);
}

window.createGallery = createGallery; 