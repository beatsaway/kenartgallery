import * as THREE from '../three/three.module.min.js';

export class GalleryControls {
    constructor(camera, scene, collisionWalls) {
        this.camera = camera;
        this.scene = scene;
        this.collisionWalls = collisionWalls;
        this.moveSpeed = 0.1;
        this.lookSpeed = 0.002;
        this.moveVector = new THREE.Vector3();
        this._isLocked = false;
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.vec = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canMove = true;
        
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
        const artworkSpacing = 8 * 5;  // Same spacing as in placeArtworks
        const randomArtworkIndex = Math.floor(Math.random() * 19);  // 19 total artworks
        const randomZ = -galleryLength / 2 + 10 + (randomArtworkIndex % 9) * artworkSpacing;
        
        // Random side of the gallery (-1 for left, 1 for right)
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = (galleryWidth / 2 - 2) * side;  // Spawn 2 units from the wall
        
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
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'KeyD':
                    this.moveRight = true;
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        });

        document.addEventListener('mousemove', (event) => {
            if (this.isLocked) {
                this.euler.setFromQuaternion(this.camera.quaternion);
                this.euler.y -= event.movementX * this.lookSpeed;
                this.euler.x -= event.movementY * this.lookSpeed;
                this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
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
        if (this.isLocked) {
            // Handle keyboard movement
            this.vec.set(0, 0, 0);
            if (this.moveForward) this.vec.z -= 1;
            if (this.moveBackward) this.vec.z += 1;
            if (this.moveLeft) this.vec.x -= 1;
            if (this.moveRight) this.vec.x += 1;

            // Add mobile movement vector
            this.vec.add(this.moveVector);

            // Apply movement
            if (this.vec.length() > 0) {
                this.vec.normalize();
                this.vec.applyQuaternion(this.camera.quaternion);
                this.vec.y = 0; // Keep movement horizontal
                this.vec.multiplyScalar(this.moveSpeed);

                const newPosition = this.camera.position.clone().add(this.vec);
                
                // Check if player is at either door (with a larger detection zone)
                const doorZone = 10; // Increased detection zone
                if (newPosition.z > this.scene.userData.galleryLength/2 - doorZone) {
                    // Teleport to back door
                    this.camera.position.z = -this.scene.userData.galleryLength/2 + doorZone;
                    console.log('Teleporting to back door'); // Debug log
                } else if (newPosition.z < -this.scene.userData.galleryLength/2 + doorZone) {
                    // Teleport to front door
                    this.camera.position.z = this.scene.userData.galleryLength/2 - doorZone;
                    console.log('Teleporting to front door'); // Debug log
                } else if (!this.checkCollisions(newPosition)) {
                    this.camera.position.copy(newPosition);
                }
            }
        }
    }
    
    checkCollisions(position) {
        const playerSize = 0.5;
        const playerHeight = 1.8;
        
        const playerMin = new THREE.Vector3(
            position.x - playerSize,
            position.y,
            position.z - playerSize
        );
        
        const playerMax = new THREE.Vector3(
            position.x + playerSize,
            position.y + playerHeight,
            position.z + playerSize
        );
        
        for (const wall of this.collisionWalls) {
            if (
                playerMax.x > wall.min.x && playerMin.x < wall.max.x &&
                playerMax.y > wall.min.y && playerMin.y < wall.max.y &&
                playerMax.z > wall.min.z && playerMin.z < wall.max.z
            ) {
                return true;
            }
        }
        
        return false;
    }
}