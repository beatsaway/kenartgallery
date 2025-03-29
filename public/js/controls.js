import * as THREE from '../three/three.module.min.js';

export class GalleryControls {
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
        const baseSpeed = 5.0;
        const sprintMultiplier = this.isSprinting ? 10.0 : 1.0;
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