/**
 * Shared 3D gallery runner for 2016, 2020, 2025.
 * Expects: window.THREE, window.GalleryControls, window.artworkDescriptions / parseArtworkDescription.
 * Reads window.GALLERY_CONFIG: galleryWidth, galleryLength, galleryHeight,
 * artworkImagePaths (array) OR artworkImagePattern + artworkCount (e.g. "images/img_{i}.webp", 10),
 * piecesPerWallLeft, piecesPerWallRight, npcCount, trainCartCount, lighting ('simple'|'spotlights').
 * Optional showInfoButton: set false to hide the hall popup “i” toggle button.
 */
(function() {
    const config = window.GALLERY_CONFIG;
    if (!config) {
        console.error('GALLERY_CONFIG required');
        return;
    }
    if (!config.artworkImagePaths && (config.artworkImagePattern == null || config.artworkCount == null)) {
        console.error('GALLERY_CONFIG needs artworkImagePaths or artworkImagePattern + artworkCount');
        return;
    }
    if (config.artworkImagePattern != null && config.artworkCount != null) {
        config.artworkImagePaths = [];
        for (var i = 1; i <= config.artworkCount; i++) {
            config.artworkImagePaths.push(config.artworkImagePattern.replace('{i}', String(i).padStart(2, '0')));
        }
    }

    const scene = new THREE.Scene();
    scene.userData.galleryWidth = config.galleryWidth != null ? config.galleryWidth : 70;
    scene.userData.galleryLength = config.galleryLength != null ? config.galleryLength : 250;
    scene.userData.galleryHeight = config.galleryHeight != null ? config.galleryHeight : 40;
    scene.userData.piecesPerWallLeft = config.piecesPerWallLeft != null ? config.piecesPerWallLeft : 5;
    scene.userData.piecesPerWallRight = config.piecesPerWallRight != null ? config.piecesPerWallRight : 5;
    scene.userData.artworkCount = config.artworkImagePaths.length;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const cameraFar = Math.max(1000, scene.userData.galleryLength * 1.2);
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, cameraFar);
    const renderer = new THREE.WebGLRenderer({ antialias: isMobile ? false : true, powerPreference: isMobile ? 'low-power' : 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('scene-container').appendChild(renderer.domElement);

    const controls = new GalleryControls(camera, scene);
    controls.setupEventListeners();

    const trainSystem = { carts: [], track: null, speed: 0.05, direction: 1, currentPosition: 0 };
    const galleryBase = (typeof window !== 'undefined' && window.GALLERY_BASE) ? window.GALLERY_BASE : '';
    function resolveAsset(path) {
        if (!galleryBase || typeof path !== 'string') return path;
        return galleryBase.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
    }
    const artworkImagePaths = (config.artworkImagePaths || []).map(function(p) { return resolveAsset(p); });
    const piecesPerWallLeft = scene.userData.piecesPerWallLeft;
    const piecesPerWallRight = scene.userData.piecesPerWallRight;
    const npcCount = config.npcCount != null ? config.npcCount : 6;
    const trainCartCount = config.trainCartCount != null ? config.trainCartCount : 4;
    const lighting = config.lighting || 'simple';

    const artworkTitles = [];
    for (let i = 1; i <= artworkImagePaths.length; i++) artworkTitles.push('Piece ' + i);
    const npcs = [];

    function createCuteMinecraftVillager() {
        const group = new THREE.Group();
        const scale = 0.5;
        const skinColor = new THREE.Color(Math.random(), Math.random(), Math.random());
        const clothesColor = new THREE.Color(Math.random(), Math.random(), Math.random());
        const headGeometry = new THREE.BoxGeometry(1*scale, 1*scale, 1*scale);
        const headMaterial = new THREE.MeshBasicMaterial({ color: skinColor });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.8*scale;
        group.add(head);
        const bodyGeometry = new THREE.BoxGeometry(0.8*scale, 0.8*scale, 0.5*scale);
        const bodyMaterial = new THREE.MeshBasicMaterial({ color: clothesColor });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);
        const armGeometry = new THREE.BoxGeometry(0.3*scale, 0.8*scale, 0.3*scale);
        group.add(new THREE.Mesh(armGeometry, bodyMaterial));
        group.children[2].position.set(-0.55*scale, 0, 0);
        group.add(new THREE.Mesh(armGeometry, bodyMaterial));
        group.children[3].position.set(0.55*scale, 0, 0);
        const legGeometry = new THREE.BoxGeometry(0.3*scale, 0.5*scale, 0.3*scale);
        const pantsMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(clothesColor).multiplyScalar(0.7) });
        group.add(new THREE.Mesh(legGeometry, pantsMaterial));
        group.children[4].position.set(-0.2*scale, -0.65*scale, 0);
        group.add(new THREE.Mesh(legGeometry, pantsMaterial));
        group.children[5].position.set(0.2*scale, -0.65*scale, 0);
        group.userData.walkStyle = { frequency: 0.8+Math.random()*0.4, legAmplitude: 0.3+Math.random()*0.4, armAmplitude: 0.2+Math.random()*0.5, bodyTilt: (Math.random()-0.5)*0.1, headBob: 0.05+Math.random()*0.1, swayAmount: Math.random()*0.1 };
        return group;
    }

    function createNPC() {
        const npc = createCuteMinecraftVillager();
        npc.position.set((Math.random()-0.5)*(scene.userData.galleryWidth-2), 0.65, -scene.userData.galleryLength/2+5+Math.random()*(scene.userData.galleryLength-10));
        npc.userData.velocity = new THREE.Vector3();
        npc.userData.direction = new THREE.Vector3(Math.random()-0.5, 0, Math.random()-0.5).normalize();
        npc.userData.speed = 0.2+Math.random()*0.5;
        npc.userData.changeDirectionTime = Math.random()*8000;
        npc.userData.lastDirectionChange = performance.now();
        npc.userData.walkCycle = Math.random()*Math.PI*2;
        npc.userData.pauseTime = 0;
        npc.userData.isPaused = false;
        scene.add(npc);
        npcs.push(npc);
        return npc;
    }
    for (let i = 0; i < npcCount; i++) createNPC();

    function updateNPCs(time) {
        for (const npc of npcs) {
            if (!npc.userData.isPaused) {
                if (Math.random() < 0.001) { npc.userData.isPaused = true; npc.userData.pauseTime = time+Math.random()*3000; }
            } else if (time > npc.userData.pauseTime) npc.userData.isPaused = false;
            if (!npc.userData.isPaused) {
                if (time - npc.userData.lastDirectionChange > npc.userData.changeDirectionTime) {
                    const angle = Math.random()*Math.PI*2;
                    npc.userData.direction.set(Math.cos(angle), 0, Math.sin(angle)).normalize();
                    npc.userData.changeDirectionTime = 3000+Math.random()*8000;
                    npc.userData.lastDirectionChange = time;
                }
                const newPosition = npc.position.clone();
                newPosition.x += npc.userData.direction.x*npc.userData.speed*0.02;
                newPosition.z += npc.userData.direction.z*npc.userData.speed*0.02;
                const margin = 1;
                newPosition.x = Math.max(-scene.userData.galleryWidth/2+margin, Math.min(scene.userData.galleryWidth/2-margin, newPosition.x));
                newPosition.z = Math.max(-scene.userData.galleryLength/2+margin, Math.min(scene.userData.galleryLength/2-margin, newPosition.z));
                npc.position.copy(newPosition);
                npc.rotation.y = Math.atan2(npc.userData.direction.x, npc.userData.direction.z);
                const style = npc.userData.walkStyle;
                npc.userData.walkCycle += style.frequency*0.1;
                npc.children[4].rotation.x = Math.sin(npc.userData.walkCycle)*style.legAmplitude;
                npc.children[5].rotation.x = Math.sin(npc.userData.walkCycle+Math.PI)*style.legAmplitude;
                npc.children[2].rotation.x = Math.sin(npc.userData.walkCycle+Math.PI)*style.armAmplitude;
                npc.children[3].rotation.x = Math.sin(npc.userData.walkCycle)*style.armAmplitude;
                npc.children[1].rotation.z = Math.sin(npc.userData.walkCycle*2)*style.swayAmount+style.bodyTilt;
                npc.children[0].rotation.x = Math.sin(npc.userData.walkCycle*2)*style.headBob;
            } else {
                npc.children.forEach(part => part.rotation.set(0,0,0));
            }
        }
    }

    function wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0] || '';
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            if (ctx.measureText(currentLine + ' ' + word).width < maxWidth) currentLine += ' ' + word;
            else { lines.push(currentLine); currentLine = word; }
        }
        lines.push(currentLine);
        return lines;
    }

    var artworkContrastVertex = [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n');
    var artworkContrastFragment = [
        'uniform sampler2D map;',
        'uniform float contrastFactor;',
        'varying vec2 vUv;',
        'void main() {',
        '  vec4 texColor = texture2D(map, vUv);',
        '  vec3 rgb = texColor.rgb;',
        '  rgb = (rgb - 0.5) * contrastFactor + 0.5;',
        '  gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), texColor.a);',
        '}'
    ].join('\n');

    function createFramedArtwork(texture, width, height, title, index) {
        const artworkGroup = new THREE.Group();
        const artworkGeometry = new THREE.PlaneGeometry(width, height);
        const artworkMaterial = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: texture },
                contrastFactor: { value: 1.1 }
            },
            vertexShader: artworkContrastVertex,
            fragmentShader: artworkContrastFragment,
            side: THREE.DoubleSide,
            depthWrite: true
        });
        const artwork = new THREE.Mesh(artworkGeometry, artworkMaterial);
        artworkGroup.add(artwork);
        const signWidth = width*0.4;
        const signHeight = height*0.1;
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0,0,512,180);
        ctx.fillStyle = '#222';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let parsed = { title: title, description: title };
        if (typeof parseArtworkDescription === 'function') {
            parsed = parseArtworkDescription(index);
        } else if (typeof artworkDescriptions !== 'undefined' && artworkDescriptions[index]) {
            const description = artworkDescriptions[index];
            if (description && typeof description === 'object') {
                parsed = { title: description.title || title, description: description.description || title };
            } else {
                const descLines = String(description).split('\n');
                parsed = { title: descLines[0].replace(/\*\*/g, '') || title, description: descLines[1] || title };
            }
        }
        ctx.font = 'bold 20px "Playfair Display", "Times New Roman", serif';
        ctx.fillText(parsed.title, 256, 30);
        ctx.font = '14px "Playfair Display", "Times New Roman", serif';
        const lines = wrapText(ctx, parsed.description, 440);
        const lineHeight = 20;
        const startY = 60 + (180 - 60 - lines.length*lineHeight)/2;
        lines.forEach((line, i) => ctx.fillText(line, 256, startY + i*lineHeight));
        const signTexture = new THREE.CanvasTexture(canvas);
        const signGeometry = new THREE.PlaneGeometry(signWidth, signHeight);
        const sign = new THREE.Mesh(signGeometry, new THREE.MeshBasicMaterial({ map: signTexture, side: THREE.DoubleSide, transparent: true }));
        sign.position.set(0, -height/2 - signHeight/2 - 0.2, 0);
        artworkGroup.add(sign);
        return artworkGroup;
    }

    let crateTexture = null;
    const textureLoader = new THREE.TextureLoader();

    function createFloor() {
        const floorGeometry = new THREE.PlaneGeometry(scene.userData.galleryWidth, scene.userData.galleryLength);
        textureLoader.load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg', function(woodTexture) {
            woodTexture.wrapS = THREE.RepeatWrapping;
            woodTexture.wrapT = THREE.RepeatWrapping;
            woodTexture.repeat.set(40, 40);
            const floorMaterial = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.8, metalness: 0.2, side: THREE.DoubleSide });
            const floor = new THREE.Mesh(floorGeometry, floorMaterial);
            floor.rotation.x = -Math.PI/2;
            floor.receiveShadow = true;
            scene.add(floor);
        });
    }

    function createWalls() {
        const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const backWall = new THREE.Mesh(new THREE.PlaneGeometry(scene.userData.galleryWidth, scene.userData.galleryHeight), wallMaterial);
        backWall.position.set(0, scene.userData.galleryHeight/2, -scene.userData.galleryLength/2);
        scene.add(backWall);
        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(scene.userData.galleryLength, scene.userData.galleryHeight), wallMaterial);
        leftWall.position.x = -scene.userData.galleryWidth/2;
        leftWall.position.y = scene.userData.galleryHeight/2;
        leftWall.rotation.y = Math.PI/2;
        scene.add(leftWall);
        const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(scene.userData.galleryLength, scene.userData.galleryHeight), wallMaterial);
        rightWall.position.x = scene.userData.galleryWidth/2;
        rightWall.position.y = scene.userData.galleryHeight/2;
        rightWall.rotation.y = -Math.PI/2;
        scene.add(rightWall);
        const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(scene.userData.galleryWidth, scene.userData.galleryHeight), wallMaterial);
        frontWall.position.set(0, scene.userData.galleryHeight/2, scene.userData.galleryLength/2);
        scene.add(frontWall);
    }

    function createLights() {
        scene.add(new THREE.AmbientLight(0xffffff, 2.0));
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x404040, 1.2);
        scene.add(hemisphereLight);
        if (lighting === 'spotlights') {
            const spotlightColor = 0xffffff;
            const spotlightIntensity = 5;
            const spotlightDistance = 30;
            const spotlightAngle = Math.PI / 4;
            const spotlightPenumbra = 0.7;
            const leftPositions = [-scene.userData.galleryLength / 3, 0, scene.userData.galleryLength / 3];
            for (let i = 0; i < leftPositions.length; i++) {
                const zPos = leftPositions[i];
                const spotlight = new THREE.SpotLight(spotlightColor, spotlightIntensity, spotlightDistance, spotlightAngle, spotlightPenumbra);
                spotlight.position.set(-scene.userData.galleryWidth / 2 + 2, scene.userData.galleryHeight - 0.5, zPos);
                spotlight.target.position.set(-scene.userData.galleryWidth / 2 + 0.1, 0, zPos);
                spotlight.castShadow = true;
                spotlight.shadow.bias = -0.0001;
                spotlight.shadow.mapSize.width = 1024;
                spotlight.shadow.mapSize.height = 1024;
                scene.add(spotlight);
                scene.add(spotlight.target);
            }
            const rightPositions = [-scene.userData.galleryLength / 3, 0, scene.userData.galleryLength / 3];
            for (let i = 0; i < rightPositions.length; i++) {
                const zPos = rightPositions[i];
                const spotlight = new THREE.SpotLight(spotlightColor, spotlightIntensity, spotlightDistance, spotlightAngle, spotlightPenumbra);
                spotlight.position.set(scene.userData.galleryWidth / 2 - 2, scene.userData.galleryHeight - 0.5, zPos);
                spotlight.target.position.set(scene.userData.galleryWidth / 2 - 0.1, 0, zPos);
                spotlight.castShadow = true;
                spotlight.shadow.bias = -0.0001;
                spotlight.shadow.mapSize.width = 1024;
                spotlight.shadow.mapSize.height = 1024;
                scene.add(spotlight);
                scene.add(spotlight.target);
            }
        }
    }

    const artworkWidth = 3.5*5, artworkHeight = 4.5*5, artworkSpacing = 8*5;
    const artworkWallOffset = 0.12*5, artworkYPosition = artworkHeight/2 + 3;

    function placeSingleArtwork(index, tex) {
        if (!tex || index >= artworkImagePaths.length) return;
        const artwork = createFramedArtwork(tex, artworkWidth, artworkHeight, artworkTitles[index], index);
        const zPos = -scene.userData.galleryLength/2 + 10 + (index < piecesPerWallLeft ? index : index - piecesPerWallLeft) * artworkSpacing;
        artwork.position.y = artworkYPosition;
        artwork.position.z = zPos;
        if (index < piecesPerWallLeft) {
            artwork.position.x = -scene.userData.galleryWidth/2 + artworkWallOffset + 0.001;
            artwork.rotation.y = Math.PI/2;
        } else {
            artwork.position.x = scene.userData.galleryWidth/2 - artworkWallOffset - 0.001;
            artwork.rotation.y = -Math.PI/2;
        }
        scene.add(artwork);
    }

    function createGallery() {
        createFloor();
        const ceilingGeometry = new THREE.PlaneGeometry(scene.userData.galleryWidth, scene.userData.galleryLength);
        const ceiling = new THREE.Mesh(ceilingGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
        ceiling.position.y = scene.userData.galleryHeight;
        ceiling.rotation.x = Math.PI/2;
        scene.add(ceiling);
        createWalls();
        createLights();
        const artworkTextures = new Array(artworkImagePaths.length);
        artworkImagePaths.forEach(function(path, idx) {
            textureLoader.load(path, function(tex) {
                artworkTextures[idx] = tex;
                placeSingleArtwork(idx, tex);
            }, undefined, function() {});
        });
    }

    function createRailwaySystem() {
        if (!crateTexture) return;
        const railSeparation = 1.2, railWidth = 0.15, railHeight = 0.1, railLength = scene.userData.galleryLength;
        const leftRailTexture = crateTexture.clone();
        leftRailTexture.repeat.set(1, 40);
        const leftRail = new THREE.Mesh(new THREE.BoxGeometry(railWidth, railHeight, railLength), new THREE.MeshStandardMaterial({ map: leftRailTexture, roughness: 0.7, metalness: 0.2, side: THREE.DoubleSide }));
        leftRail.position.set(-railSeparation/2, 0.05, 0);
        scene.add(leftRail);
        const rightRailTexture = crateTexture.clone();
        rightRailTexture.repeat.set(1, 40);
        const rightRail = new THREE.Mesh(new THREE.BoxGeometry(railWidth, railHeight, railLength), new THREE.MeshStandardMaterial({ map: rightRailTexture, roughness: 0.7, metalness: 0.2, side: THREE.DoubleSide }));
        rightRail.position.set(railSeparation/2, 0.05, 0);
        scene.add(rightRail);
        const sleeperTexture = crateTexture.clone();
        sleeperTexture.repeat.set(2, 1);
        const sleeperMaterial = new THREE.MeshStandardMaterial({ map: sleeperTexture, roughness: 0.8, metalness: 0.2, side: THREE.DoubleSide });
        for (let z = -scene.userData.galleryLength/2+2; z < scene.userData.galleryLength/2-2; z += 2) {
            const sleeper = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.4), sleeperMaterial);
            sleeper.position.set(0, 0.02, z);
            scene.add(sleeper);
        }
        const cartSpacing = 2.5;
        for (let i = 0; i < trainCartCount; i++) {
            const cart = createMinecart();
            cart.position.z = -scene.userData.galleryLength/2 + 5 + i*cartSpacing;
            trainSystem.carts.push(cart);
            scene.add(cart);
        }
        trainSystem.update = function() {
            trainSystem.carts.forEach(function(cart) {
                cart.position.z += trainSystem.speed;
                const margin = 1;
                if (cart.position.z > scene.userData.galleryLength/2+margin) cart.position.z = -scene.userData.galleryLength/2-margin;
                else if (cart.position.z < -scene.userData.galleryLength/2-margin) cart.position.z = scene.userData.galleryLength/2+margin;
                cart.children.slice(3).forEach(function(wheel) { wheel.rotation.x += 0.1*trainSystem.speed; });
                if (camera.userData.onTrain === cart) {
                    camera.position.x = cart.position.x;
                    camera.position.y = cart.position.y + 1.5;
                    camera.position.z = cart.position.z;
                }
            });
        };
    }

    function createMinecart() {
        const cartGroup = new THREE.Group();
        const cartTexture = crateTexture.clone();
        cartTexture.repeat.set(2, 1);
        const baseMaterial = new THREE.MeshStandardMaterial({ map: cartTexture, roughness: 0.7, metalness: 0.2 });
        const base = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 2), baseMaterial);
        base.position.y = 0.5;
        cartGroup.add(base);
        const sideMaterial = new THREE.MeshStandardMaterial({ map: cartTexture, roughness: 0.7, metalness: 0.2 });
        const leftSide = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 2), sideMaterial);
        leftSide.position.set(-0.95, 1, 0);
        cartGroup.add(leftSide);
        const rightSide = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 2), sideMaterial);
        rightSide.position.set(0.95, 1, 0);
        cartGroup.add(rightSide);
        const wheelMaterial = new THREE.MeshStandardMaterial({ map: cartTexture, roughness: 0.7, metalness: 0.2 });
        [[-0.8,0.3,-0.8],[0.8,0.3,-0.8],[-0.8,0.3,0.8],[0.8,0.3,0.8]].forEach(function(pos) {
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16), wheelMaterial);
            wheel.rotation.z = Math.PI/2;
            wheel.position.set(pos[0], pos[1], pos[2]);
            cartGroup.add(wheel);
        });
        return cartGroup;
    }

    function getArtworkPosition(index) {
        const n = Math.max(0, Math.min(index, scene.userData.artworkCount - 1));
        const gw = scene.userData.galleryWidth;
        const gl = scene.userData.galleryLength;
        let x, z;
        if (n < piecesPerWallLeft) {
            x = -gw/2 + artworkWallOffset + 0.001;
            z = -gl/2 + 10 + n * artworkSpacing;
        } else {
            const i = n - piecesPerWallLeft;
            x = gw/2 - artworkWallOffset - 0.001;
            z = -gl/2 + 10 + i * artworkSpacing;
        }
        return { x, y: artworkYPosition, z };
    }

    function moveCameraToArtwork(index) {
        if (camera.userData.onTrain) camera.userData.onTrain = null;
        const n = Math.max(0, Math.min(index, scene.userData.artworkCount - 1));
        const pos = getArtworkPosition(n);
        const gw = scene.userData.galleryWidth;
        const lookDown = 2;
        const lookAt = new THREE.Vector3(pos.x, pos.y - lookDown, pos.z);
        const standBack = 36;
        if (n < piecesPerWallLeft) {
            camera.position.set(-gw/2 + standBack, 0.8, pos.z);
        } else {
            camera.position.set(gw/2 - standBack, 0.8, pos.z);
        }
        camera.lookAt(lookAt);
        controls.euler.setFromQuaternion(camera.quaternion);
    }

    window.moveCameraToArtwork = moveCameraToArtwork;
    window.getGalleryArtworkCount = function() { return scene.userData.artworkCount; };

    function setRandomInitialPosition() {
        const isLeftWall = Math.random() < 0.5;
        const zPos = -scene.userData.galleryLength/2 + 10 + Math.floor(Math.random()*piecesPerWallLeft)*(8*5);
        camera.position.set(0, 0.8, zPos);
        if (isLeftWall) camera.lookAt(new THREE.Vector3(-scene.userData.galleryWidth/2, 0.8, zPos));
        else camera.lookAt(new THREE.Vector3(scene.userData.galleryWidth/2, 0.8, zPos));
    }

    textureLoader.load('https://threejs.org/examples/textures/crate.gif', function(tex) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        crateTexture = tex;
        createRailwaySystem();
    });

    createGallery();
    moveCameraToArtwork(0);

    const hallPopup = document.getElementById('hall-popup');
    if (hallPopup) {
        hallPopup.addEventListener('click', function(e) {
            if (e.target.classList.contains('nodeco')) return;
        });
        document.addEventListener('click', function(e) {
            if (e.target.closest('.hall-info-btn')) return;
            if (!hallPopup.contains(e.target) && (hallPopup.classList.contains('visible') || hallPopup.classList.contains('show-on-load'))) {
                hallPopup.classList.remove('visible');
                hallPopup.classList.remove('show-on-load');
            }
        });
        if (config.showInfoButton !== false) {
            const infoBtn = document.createElement('button');
            infoBtn.type = 'button';
            infoBtn.className = 'hall-info-btn';
            infoBtn.setAttribute('aria-label', 'Info');
            infoBtn.textContent = 'i';
            infoBtn.style.cssText = 'position:fixed;top:10px;right:16px;z-index:1003;width:28px;height:28px;padding:0;border:none;border-radius:50%;background:rgba(255,255,255,0.2);color:#fff;font-size:16px;font-style:italic;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;text-shadow:0 1px 2px rgba(0,0,0,0.5)';
            infoBtn.addEventListener('mouseenter', function() { infoBtn.style.background = 'rgba(255,255,255,0.35)'; });
            infoBtn.addEventListener('mouseleave', function() { infoBtn.style.background = 'rgba(255,255,255,0.2)'; });
            infoBtn.addEventListener('click', function() {
                if (hallPopup.classList.contains('visible') || hallPopup.classList.contains('show-on-load')) {
                    hallPopup.classList.remove('visible');
                    hallPopup.classList.remove('show-on-load');
                } else {
                    hallPopup.classList.add('visible');
                }
            });
            document.body.appendChild(infoBtn);
        }
    }

    window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const trainButton = document.getElementById('train-button');
    function updateTrainButton() {
        if (!trainSystem || !trainSystem.carts || trainSystem.carts.length === 0) { if (trainButton) trainButton.style.display = 'none'; return; }
        let nearest = null, shortest = Infinity;
        trainSystem.carts.forEach(function(cart) {
            const d = Math.sqrt(Math.pow(camera.position.x-cart.position.x,2)+Math.pow(camera.position.z-cart.position.z,2));
            if (d < shortest) { shortest = d; nearest = cart; }
        });
        if (trainButton) trainButton.style.display = (shortest < 3 && nearest) ? 'block' : 'none';
    }
    function handleTrainInteraction() {
        let nearest = null, shortest = Infinity;
        trainSystem.carts.forEach(function(cart) {
            const d = Math.sqrt(Math.pow(camera.position.x-cart.position.x,2)+Math.pow(camera.position.z-cart.position.z,2));
            if (d < shortest) { shortest = d; nearest = cart; }
        });
        if (shortest < 3 && nearest) {
            if (!camera.userData.onTrain) {
                camera.userData.onTrain = nearest;
                camera.position.x = nearest.position.x + 0.5;
                camera.position.y = nearest.position.y + 1.2;
                camera.position.z = nearest.position.z;
            } else {
                camera.userData.onTrain = null;
                camera.position.x = nearest.position.x + 2;
            }
        }
    }
    document.addEventListener('keydown', function(e) { if (e.code === 'KeyE') handleTrainInteraction(); });
    if (trainButton) trainButton.addEventListener('click', handleTrainInteraction);

    let lastMovementUpdate = 0;
    const MOVEMENT_UPDATE_INTERVAL = 20;
    function animate() {
        requestAnimationFrame(animate);
        if (document.hidden) return;
        const time = performance.now();
        updateNPCs(time);
        if (trainSystem && typeof trainSystem.update === 'function') {
            trainSystem.update();
            updateTrainButton();
        }
        if (camera.userData.onTrain) camera.position.z = camera.userData.onTrain.position.z;
        if (camera.userData.movement && time - lastMovementUpdate >= MOVEMENT_UPDATE_INTERVAL) {
            const m = camera.userData.movement;
            camera.position.x += m.x*0.5*m.distance;
            camera.position.z += m.z*0.5*m.distance;
            camera.position.y = 0.8;
            lastMovementUpdate = time;
        }
        controls.update();
        renderer.render(scene, camera);
    }

    const touchAreaRadius = 100, touchAreaMargin = 20;
    let activeTouches = new Map();
    const cameraTouchArea = document.createElement('div');
    cameraTouchArea.style.cssText = 'position:fixed;bottom:'+touchAreaMargin+'px;right:'+touchAreaMargin+'px;width:'+(touchAreaRadius*2)+'px;height:'+(touchAreaRadius*2)+'px;border:2px solid rgba(255,255,255,0.3);border-radius:50%;pointer-events:none;z-index:1000;display:none;';
    document.body.appendChild(cameraTouchArea);
    const movementTouchArea = document.createElement('div');
    movementTouchArea.style.cssText = 'position:fixed;bottom:'+touchAreaMargin+'px;left:'+touchAreaMargin+'px;width:'+(touchAreaRadius*2)+'px;height:'+(touchAreaRadius*2)+'px;border:2px solid rgba(255,255,255,0.3);border-radius:50%;pointer-events:none;z-index:1000;display:none;';
    document.body.appendChild(movementTouchArea);
    if (isMobile) { cameraTouchArea.style.display = 'block'; movementTouchArea.style.display = 'block'; }
    function isTouchInCameraArea(x, y) {
        const cx = window.innerWidth - touchAreaMargin - touchAreaRadius, cy = window.innerHeight - touchAreaMargin - touchAreaRadius;
        return Math.sqrt((x-cx)*(x-cx)+(y-cy)*(y-cy)) <= touchAreaRadius;
    }
    function isTouchInMovementArea(x, y) {
        const cx = touchAreaMargin + touchAreaRadius, cy = window.innerHeight - touchAreaMargin - touchAreaRadius;
        return Math.sqrt((x-cx)*(x-cx)+(y-cy)*(y-cy)) <= touchAreaRadius;
    }
    document.addEventListener('touchstart', function(e) {
        e.preventDefault();
        for (let i = 0; i < e.touches.length; i++) {
            const t = e.touches[i];
            const id = t.identifier;
            if (isTouchInMovementArea(t.clientX, t.clientY)) {
                activeTouches.set(id, { type: 'movement', startX: t.clientX, startY: t.clientY, currentX: t.clientX, currentY: t.clientY });
                movementTouchArea.style.borderColor = 'rgba(255,255,255,0.6)';
                if (!controls.isLocked) controls.lock();
            } else if (isTouchInCameraArea(t.clientX, t.clientY)) {
                activeTouches.set(id, { type: 'camera', startX: t.clientX, startY: t.clientY, currentX: t.clientX, currentY: t.clientY });
                cameraTouchArea.style.borderColor = 'rgba(255,255,255,0.6)';
                if (!controls.isLocked) controls.lock();
            }
        }
    });
    document.addEventListener('touchmove', function(e) {
        e.preventDefault();
        for (let i = 0; i < e.touches.length; i++) {
            const t = e.touches[i];
            const d = activeTouches.get(t.identifier);
            if (!d) continue;
            d.currentX = t.clientX;
            d.currentY = t.clientY;
            const deltaX = d.currentX - d.startX, deltaY = d.currentY - d.startY;
            if (d.type === 'movement' && !camera.userData.onTrain) {
                const cx = touchAreaMargin + touchAreaRadius, cy = window.innerHeight - touchAreaMargin - touchAreaRadius;
                const relX = d.currentX - cx, relY = d.currentY - cy;
                const angle = -Math.atan2(relY, relX);
                const dist = Math.min(1, Math.sqrt(relX*relX+relY*relY)/touchAreaRadius);
                const camFwd = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
                const camRight = new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);
                const moveX = Math.cos(angle)*camRight.x + Math.sin(angle)*camFwd.x;
                const moveZ = Math.cos(angle)*camRight.z + Math.sin(angle)*camFwd.z;
                const len = Math.sqrt(moveX*moveX+moveZ*moveZ);
                camera.userData.movement = { x: moveX/len, z: moveZ/len, distance: dist };
            } else if (d.type === 'camera') {
                controls.euler.setFromQuaternion(controls.camera.quaternion);
                controls.euler.y -= deltaX * controls.lookSpeed * 2;
                controls.euler.y = Math.atan2(Math.sin(controls.euler.y), Math.cos(controls.euler.y));
                controls.euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, controls.euler.x - deltaY * controls.lookSpeed * 2));
                controls.camera.quaternion.setFromEuler(controls.euler);
            }
            d.startX = d.currentX;
            d.startY = d.currentY;
        }
    });
    document.addEventListener('touchend', function(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const id = e.changedTouches[i].identifier;
            const d = activeTouches.get(id);
            if (d) {
                if (d.type === 'movement') movementTouchArea.style.borderColor = 'rgba(255,255,255,0.3)';
                else if (d.type === 'camera') cameraTouchArea.style.borderColor = 'rgba(255,255,255,0.3)';
                activeTouches.delete(id);
            }
        }
        if (!Array.from(activeTouches.values()).some(function(t){ return t.type === 'movement'; })) camera.userData.movement = null;
        if (activeTouches.size === 0 && controls.isLocked) controls.unlock();
    });

    (function addGuideHeader() {
        const style = document.createElement('style');
        style.textContent = '#hall-guide-header{position:fixed;top:0;left:0;right:0;z-index:1002;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;color:#fff;font-family:Helvetica Neue,Arial,sans-serif;font-size:14px;pointer-events:auto}#hall-guide-header select{padding:4px 8px;border:none;background:transparent;color:#fff;cursor:pointer;min-width:3em;font-size:inherit;text-align:center;text-shadow:0 1px 3px rgba(0,0,0,0.9),0 0 8px rgba(0,0,0,0.6);appearance:none;-webkit-appearance:none;-moz-appearance:none;background-image:none}#hall-guide-header select option{background:#222;color:#fff}#hall-guide-prev,#hall-guide-next{padding:2px 6px;border:none;background:transparent;color:#fff;cursor:pointer;font-size:inherit;text-shadow:0 1px 2px rgba(0,0,0,0.5)}#hall-guide-prev:hover,#hall-guide-next:hover{opacity:0.85}';
        document.head.appendChild(style);
        const header = document.createElement('header');
        header.id = 'hall-guide-header';
        header.innerHTML = '<button type="button" id="hall-guide-prev" title="Previous">◀</button><select id="hall-guide-select"></select><button type="button" id="hall-guide-next" title="Next">▶</button>';
        const count = scene.userData.artworkCount;
        const select = header.querySelector('#hall-guide-select');
        for (let i = 1; i <= count; i++) select.appendChild(new Option('' + i, i - 1));
        select.value = 0;
        function goToSelected() {
            const n = parseInt(select.value, 10);
            if (!isNaN(n) && window.moveCameraToArtwork) window.moveCameraToArtwork(n);
            // Re-request pointer lock after nav; clicking button/select exits lock and limits mouse look
            setTimeout(function() {
                if (controls && !controls.isLocked) controls.lock();
            }, 0);
        }
        select.addEventListener('change', goToSelected);
        header.querySelector('#hall-guide-prev').addEventListener('click', function() {
            const idx = (parseInt(select.value, 10) - 1 + count) % count;
            select.value = idx;
            goToSelected();
        });
        header.querySelector('#hall-guide-next').addEventListener('click', function() {
            const idx = (parseInt(select.value, 10) + 1) % count;
            select.value = idx;
            goToSelected();
        });
        function goHome() {
            var path = location.pathname.replace(/\/$/, '');
            var segments = path.split('/').filter(Boolean);
            segments.pop();
            var galleryRoot = segments.length ? '/' + segments.join('/') + '/' : '/';
            window.location.href = location.origin + galleryRoot + 'index.html';
        }
        document.addEventListener('keydown', function(e) {
            var tag = document.activeElement && document.activeElement.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (e.code === 'KeyP') {
                e.preventDefault();
                var idx = (parseInt(select.value, 10) - 1 + count) % count;
                select.value = idx;
                goToSelected();
            } else if (e.code === 'KeyN') {
                e.preventDefault();
                var idx = (parseInt(select.value, 10) + 1) % count;
                select.value = idx;
                goToSelected();
            } else if (e.code === 'KeyH') {
                e.preventDefault();
                goHome();
            } else if (e.code === 'KeyI') {
                e.preventDefault();
                var popup = document.getElementById('hall-popup');
                if (popup) {
                    if (popup.classList.contains('visible') || popup.classList.contains('show-on-load')) {
                        popup.classList.remove('visible');
                        popup.classList.remove('show-on-load');
                    } else {
                        popup.classList.add('visible');
                    }
                }
            }
        });
        document.body.appendChild(header);
    })();

    animate();
})();
