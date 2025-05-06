import * as THREE from 'three';

export function createCuteMinecraftVillager() {
    const group = new THREE.Group();
    const scale = 0.5;
    const skinColor = new THREE.Color(Math.random(), Math.random(), Math.random());
    const clothesColor = new THREE.Color(Math.random(), Math.random(), Math.random());
    const headGeometry = new THREE.BoxGeometry(1 * scale, 1 * scale, 1 * scale);
    const headMaterial = new THREE.MeshBasicMaterial({ color: skinColor });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.8 * scale;
    group.add(head);
    const bodyGeometry = new THREE.BoxGeometry(0.8 * scale, 0.8 * scale, 0.5 * scale);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: clothesColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0;
    group.add(body);
    const armGeometry = new THREE.BoxGeometry(0.3 * scale, 0.8 * scale, 0.3 * scale);
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
    leftArm.position.set(-0.55 * scale, 0, 0);
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
    rightArm.position.set(0.55 * scale, 0, 0);
    group.add(rightArm);
    const legGeometry = new THREE.BoxGeometry(0.3 * scale, 0.5 * scale, 0.3 * scale);
    const pantsMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(clothesColor).multiplyScalar(0.7) });
    const leftLeg = new THREE.Mesh(legGeometry, pantsMaterial);
    leftLeg.position.set(-0.2 * scale, -0.65 * scale, 0);
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeometry, pantsMaterial);
    rightLeg.position.set(0.2 * scale, -0.65 * scale, 0);
    group.add(rightLeg);
    group.userData.walkStyle = {
        frequency: 0.8 + Math.random() * 0.4,
        legAmplitude: 0.3 + Math.random() * 0.4,
        armAmplitude: 0.2 + Math.random() * 0.5,
        bodyTilt: (Math.random() - 0.5) * 0.1,
        headBob: 0.05 + Math.random() * 0.1,
        swayAmount: Math.random() * 0.1
    };
    return group;
}

export function createNPC(scene) {
    const npc = createCuteMinecraftVillager();
    const x = (Math.random() - 0.5) * (scene.userData.galleryWidth - 2);
    const z = -scene.userData.galleryLength / 2 + 5 + Math.random() * (scene.userData.galleryLength - 10);
    npc.position.set(x, 0.65, z);
    npc.userData.velocity = new THREE.Vector3();
    npc.userData.direction = new THREE.Vector3(
        Math.random() - 0.5,
        0,
        Math.random() - 0.5
    ).normalize();
    npc.userData.speed = 0.2 + Math.random() * 0.5;
    npc.userData.changeDirectionTime = Math.random() * 8000;
    npc.userData.lastDirectionChange = performance.now();
    npc.userData.walkCycle = Math.random() * Math.PI * 2;
    npc.userData.pauseTime = 0;
    npc.userData.isPaused = false;
    scene.add(npc);
    return npc;
}

export function initNPCs(scene, npcCount) {
    const npcs = [];
    for (let i = 0; i < npcCount; i++) {
        npcs.push(createNPC(scene));
    }
    return npcs;
}

export function updateNPCs(npcs, scene, time) {
    for (const npc of npcs) {
        if (!npc.userData.isPaused) {
            if (Math.random() < 0.001) {
                npc.userData.isPaused = true;
                npc.userData.pauseTime = time + Math.random() * 3000;
            }
        } else if (time > npc.userData.pauseTime) {
            npc.userData.isPaused = false;
        }
        if (!npc.userData.isPaused) {
            if (time - npc.userData.lastDirectionChange > npc.userData.changeDirectionTime) {
                const angle = Math.random() * Math.PI * 2;
                npc.userData.direction.set(
                    Math.cos(angle),
                    0,
                    Math.sin(angle)
                ).normalize();
                npc.userData.changeDirectionTime = 3000 + Math.random() * 8000;
                npc.userData.lastDirectionChange = time;
            }
            const newPosition = npc.position.clone();
            newPosition.x += npc.userData.direction.x * npc.userData.speed * 0.02;
            newPosition.z += npc.userData.direction.z * npc.userData.speed * 0.02;
            const margin = 1;
            const maxX = scene.userData.galleryWidth/2 - margin;
            const maxZ = scene.userData.galleryLength/2 - margin;
            newPosition.x = Math.max(-maxX, Math.min(maxX, newPosition.x));
            newPosition.z = Math.max(-maxZ, Math.min(maxZ, newPosition.z));
            npc.position.copy(newPosition);
            npc.rotation.y = Math.atan2(npc.userData.direction.x, npc.userData.direction.z);
            const style = npc.userData.walkStyle;
            npc.userData.walkCycle += style.frequency * 0.1;
            const leftLeg = npc.children[4];
            const rightLeg = npc.children[5];
            leftLeg.rotation.x = Math.sin(npc.userData.walkCycle) * style.legAmplitude;
            rightLeg.rotation.x = Math.sin(npc.userData.walkCycle + Math.PI) * style.legAmplitude;
            const leftArm = npc.children[2];
            const rightArm = npc.children[3];
            leftArm.rotation.x = Math.sin(npc.userData.walkCycle + Math.PI) * style.armAmplitude;
            rightArm.rotation.x = Math.sin(npc.userData.walkCycle) * style.armAmplitude;
            const body = npc.children[1];
            const head = npc.children[0];
            body.rotation.z = Math.sin(npc.userData.walkCycle * 2) * style.swayAmount + style.bodyTilt;
            head.rotation.x = Math.sin(npc.userData.walkCycle * 2) * style.headBob;
        } else {
            npc.children.forEach(part => part.rotation.set(0, 0, 0));
        }
    }
} 