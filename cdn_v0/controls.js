class GalleryControls {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.moveSpeed = 0.1;
        this.lookSpeed = 0.001;
        this.moveVector = new THREE.Vector3();
        this._isLocked = false;
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.vec = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isSprinting = false;
        this.canMove = true;
        this.prevTime = performance.now();
        
        // Event handling
        this.eventListeners = {
            lock: [],
            unlock: []
        };
        
        this.setupEventListeners();
        this.controlsInfoElement = document.getElementById('controls-info');
        
        // Set initial camera position
        this.setRandomSpawnPosition();
    }
    
    addEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }
    
    removeEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }
    
    dispatchEvent(event) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback());
        }
    }
    
    lock() {
        document.body.requestPointerLock();
        this._isLocked = true;
        this.dispatchEvent({ type: 'lock' });
    }
    
    unlock() {
        document.exitPointerLock();
        this._isLocked = false;
        this.dispatchEvent({ type: 'unlock' });
    }
    
    get isLocked() {
        return this._isLocked;
    }
    
    set isLocked(value) {
        this._isLocked = value;
    }
    
    setRandomSpawnPosition() {
        const galleryLength = this.scene.userData.galleryLength;
        const galleryWidth = this.scene.userData.galleryWidth;
        
        // Random position along the gallery, closer to a random artwork
        const artworkSpacing = 8 * 5;
        const randomArtworkIndex = Math.floor(Math.random() * 19);
        const randomZ = -galleryLength / 2 + 10 + (randomArtworkIndex % 9) * artworkSpacing;
        
        // Random side of the gallery (-1 for left, 1 for right)
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = (galleryWidth / 2 - 2) * side;
        
        // Set camera position
        this.camera.position.set(x, 1.7, randomZ);
        
        // Set camera rotation to face the center
        this.euler.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        this.camera.quaternion.setFromEuler(this.euler);
    }
    
    setupEventListeners() {
        document.addEventListener('click', () => {
            if (!this.isLocked) {
                this.lock();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (!this.isLocked) return;
            
            switch (event.code) {
                case 'KeyW': this.moveBackward = true; break;
                case 'KeyS': this.moveForward = true; break;
                case 'KeyA': this.moveRight = true; break;
                case 'KeyD': this.moveLeft = true; break;
                case 'ShiftLeft':
                case 'ShiftRight': this.isSprinting = true; break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            if (!this.isLocked) return;
            
            switch (event.code) {
                case 'KeyW': this.moveBackward = false; break;
                case 'KeyS': this.moveForward = false; break;
                case 'KeyA': this.moveRight = false; break;
                case 'KeyD': this.moveLeft = false; break;
                case 'ShiftLeft':
                case 'ShiftRight': this.isSprinting = false; break;
            }
        });
        
        document.addEventListener('mousemove', (event) => {
            if (this.isLocked) {
                this.euler.setFromQuaternion(this.camera.quaternion);
                this.euler.y -= event.movementX * this.lookSpeed;
                this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, 
                    this.euler.x - event.movementY * this.lookSpeed));
                this.camera.quaternion.setFromEuler(this.euler);
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement !== null;
            if (!this.isLocked) {
                this.unlock();
            }
        });
        
        // Hide controls info after a few seconds
        setTimeout(() => {
            if (this.controlsInfoElement) {
                this.controlsInfoElement.style.display = 'none';
            }
        }, 5000);
    }
    
    update() {
        if (!this.isLocked) return;

        const time = performance.now();
        const deltaTime = (time - this.prevTime) / 1000;
        this.prevTime = time;

        // Calculate movement vector based on key inputs
        this.moveVector.x = 0;
        this.moveVector.z = 0;

        if (this.moveForward) this.moveVector.z = -1;
        if (this.moveBackward) this.moveVector.z = 1;
        if (this.moveLeft) this.moveVector.x = -1;
        if (this.moveRight) this.moveVector.x = 1;

        // Normalize the vector if moving diagonally
        if (this.moveVector.length() > 1) {
            this.moveVector.normalize();
        }

        // Calculate new position
        const newPosition = this.camera.position.clone();
        const baseSpeed = 10.0;
        const sprintMultiplier = this.isSprinting ? 2.0 : 1.0;
        const moveSpeed = baseSpeed * sprintMultiplier;
        const moveAmount = moveSpeed * deltaTime;

        // Get camera's forward and right vectors
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();

        // Apply movement based on input
        if (this.moveVector.length() > 0) {
            const moveDirection = new THREE.Vector3();
            moveDirection.addScaledVector(forward, this.moveVector.z);
            moveDirection.addScaledVector(right, this.moveVector.x);
            moveDirection.normalize();
            newPosition.addScaledVector(moveDirection, moveAmount);
        }

        // Simple boundary check based on floor size
        const galleryWidth = this.scene.userData.galleryWidth;
        const galleryLength = this.scene.userData.galleryLength;
        const margin = 1; // Keep player away from walls

        // Clamp position to gallery boundaries
        newPosition.x = Math.max(-galleryWidth/2 + margin, Math.min(galleryWidth/2 - margin, newPosition.x));
        newPosition.z = Math.max(-galleryLength/2 + margin, Math.min(galleryLength/2 - margin, newPosition.z));

        // Update camera position
        this.camera.position.copy(newPosition);
    }
}

function setupInputHandlers(camera, galleryControls, trainButton, handleTrainInteraction, isMobile) {
    // Keyboard: E to board/exit train
    document.addEventListener('keydown', (event) => {
        if (event.code === 'KeyE') {
            handleTrainInteraction();
        }
    });
    // Train button click
    trainButton.addEventListener('click', handleTrainInteraction);

    // Touch input and UI
    let activeTouches = new Map();
    const touchAreaRadius = 100;
    const touchAreaMargin = 20;
    // Visual indicators for touch areas
    const cameraTouchArea = document.createElement('div');
    cameraTouchArea.style.cssText = `
        position: fixed;
        bottom: ${touchAreaMargin}px;
        right: ${touchAreaMargin}px;
        width: ${touchAreaRadius * 2}px;
        height: ${touchAreaRadius * 2}px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        display: none;
    `;
    document.body.appendChild(cameraTouchArea);
    const movementTouchArea = document.createElement('div');
    movementTouchArea.style.cssText = `
        position: fixed;
        bottom: ${touchAreaMargin}px;
        left: ${touchAreaMargin}px;
        width: ${touchAreaRadius * 2}px;
        height: ${touchAreaRadius * 2}px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        display: none;
    `;
    document.body.appendChild(movementTouchArea);
    if (isMobile) {
        cameraTouchArea.style.display = 'block';
        movementTouchArea.style.display = 'block';
    }
    function isTouchInCameraArea(touchX, touchY) {
        const centerX = window.innerWidth - touchAreaMargin - touchAreaRadius;
        const centerY = window.innerHeight - touchAreaMargin - touchAreaRadius;
        const distance = Math.sqrt(
            Math.pow(touchX - centerX, 2) + 
            Math.pow(touchY - centerY, 2)
        );
        return distance <= touchAreaRadius;
    }
    function isTouchInMovementArea(touchX, touchY) {
        const centerX = touchAreaMargin + touchAreaRadius;
        const centerY = window.innerHeight - touchAreaMargin - touchAreaRadius;
        const distance = Math.sqrt(
            Math.pow(touchX - centerX, 2) + 
            Math.pow(touchY - centerY, 2)
        );
        return distance <= touchAreaRadius;
    }
    document.addEventListener('touchstart', (event) => {
        event.preventDefault();
        for (const touch of event.touches) {
            const touchId = touch.identifier;
            if (isTouchInMovementArea(touch.clientX, touch.clientY)) {
                activeTouches.set(touchId, {
                    type: 'movement',
                    startX: touch.clientX,
                    startY: touch.clientY,
                    currentX: touch.clientX,
                    currentY: touch.clientY
                });
                movementTouchArea.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                if (!galleryControls.isLocked) {
                    galleryControls.lock();
                }
            } else if (isTouchInCameraArea(touch.clientX, touch.clientY)) {
                activeTouches.set(touchId, {
                    type: 'camera',
                    startX: touch.clientX,
                    startY: touch.clientY,
                    currentX: touch.clientX,
                    currentY: touch.clientY
                });
                if (!galleryControls.isLocked) {
                    galleryControls.lock();
                }
                cameraTouchArea.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            }
        }
    });
    document.addEventListener('touchmove', (event) => {
        event.preventDefault();
        for (const touch of event.touches) {
            const touchId = touch.identifier;
            const touchData = activeTouches.get(touchId);
            if (!touchData) continue;
            touchData.currentX = touch.clientX;
            touchData.currentY = touch.clientY;
            const deltaX = touchData.currentX - touchData.startX;
            const deltaY = touchData.currentY - touchData.startY;
            if (touchData.type === 'movement' && !camera.userData.onTrain) {
                const centerX = touchAreaMargin + touchAreaRadius;
                const centerY = window.innerHeight - touchAreaMargin - touchAreaRadius;
                const relativeX = touchData.currentX - centerX;
                const relativeY = touchData.currentY - centerY;
                const angle = -Math.atan2(relativeY, relativeX);
                const distance = Math.min(1, Math.sqrt(relativeX * relativeX + relativeY * relativeY) / touchAreaRadius);
                const cameraForward = new THREE.Vector3(0, 0, -1);
                cameraForward.applyQuaternion(camera.quaternion);
                const cameraRight = new THREE.Vector3(1, 0, 0);
                cameraRight.applyQuaternion(camera.quaternion);
                const moveX = Math.cos(angle) * cameraRight.x + Math.sin(angle) * cameraForward.x;
                const moveZ = Math.cos(angle) * cameraRight.z + Math.sin(angle) * cameraForward.z;
                const moveLength = Math.sqrt(moveX * moveX + moveZ * moveZ);
                const normalizedMoveX = moveX / moveLength;
                const normalizedMoveZ = moveZ / moveLength;
                camera.userData.movement = {
                    x: normalizedMoveX,
                    z: normalizedMoveZ,
                    distance: distance
                };
            } else if (touchData.type === 'camera') {
                galleryControls.euler.setFromQuaternion(galleryControls.camera.quaternion);
                galleryControls.euler.y -= deltaX * galleryControls.lookSpeed * 2;
                galleryControls.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, 
                    galleryControls.euler.x - deltaY * galleryControls.lookSpeed * 2));
                galleryControls.camera.quaternion.setFromEuler(galleryControls.euler);
            }
            touchData.startX = touchData.currentX;
            touchData.startY = touchData.currentY;
        }
    });
    document.addEventListener('touchend', (event) => {
        for (const touch of event.changedTouches) {
            const touchId = touch.identifier;
            const touchData = activeTouches.get(touchId);
            if (touchData) {
                if (touchData.type === 'movement') {
                    movementTouchArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                } else if (touchData.type === 'camera') {
                    cameraTouchArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }
                activeTouches.delete(touchId);
            }
        }
        if (!Array.from(activeTouches.values()).some(touch => touch.type === 'movement')) {
            camera.userData.movement = null;
        }
        if (activeTouches.size === 0 && galleryControls.isLocked) {
            galleryControls.unlock();
        }
    });
}

// At the end of the file:
window.GalleryControls = GalleryControls;
window.setupInputHandlers = setupInputHandlers;