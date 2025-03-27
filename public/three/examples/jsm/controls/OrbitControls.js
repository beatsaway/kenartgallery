import { EventDispatcher, MOUSE, Quaternion, Vector2, Vector3 } from 'three';

class OrbitControls extends EventDispatcher {
    constructor(camera, domElement) {
        super();

        this.camera = camera;
        this.domElement = (domElement !== undefined) ? domElement : document;

        // Set to false to disable this control
        this.enabled = true;

        // "target" sets the location of focus, where the camera orbits around
        this.target = new Vector3();

        // How far you can dolly in and out ( PerspectiveCamera only )
        this.minDistance = 0;
        this.maxDistance = Infinity;

        // How far you can zoom in and out ( OrthographicCamera only )
        this.minZoom = 0;
        this.maxZoom = Infinity;

        // How far you can orbit vertically, upper and lower limits.
        // Range is 0 to Math.PI radians.
        this.minPolarAngle = 0;
        this.maxPolarAngle = Math.PI;

        // How far you can orbit horizontally, upper and lower limits.
        // If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )
        this.minAzimuthAngle = - Infinity;
        this.maxAzimuthAngle = Infinity;

        // Set to true to enable damping (inertia)
        // If damping is enabled, you must call controls.update() in your animation loop
        this.enableDamping = false;
        this.dampingFactor = 0.05;

        // This option actually enables dollying in and out; left as "zoom" for backward compatibility.
        // Set to false to disable zooming
        this.enableZoom = true;
        this.zoomSpeed = 1.0;

        // Set to false to disable rotating
        this.enableRotate = true;
        this.rotateSpeed = 1.0;

        // Set to false to disable panning
        this.enablePan = true;
        this.panSpeed = 1.0;
        this.screenSpacePanning = true; // if true, pan in screen-space
        this.panningMode = 'translate'; // 'translate' or 'rotate'

        // Set to true to automatically rotate around the target
        this.autoRotate = false;
        this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

        // Set to false to disable use of the keys (page up, page down, home, end)
        this.enableKeys = true;

        // The four arrow keys
        this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

        // Mouse buttons
        this.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };

        // Touch fingers
        this.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY };

        // for reset
        this.target0 = this.target.clone();
        this.position0 = this.camera.position.clone();
        this.zoom0 = this.camera.zoom;

        // the target DOM element for key events
        this._domElementKeyEvents = null;

        // for focus
        this._focus = false;

        // public methods
        this.getPolarAngle = function () {
            const spherical = new Spherical();
            spherical.setFromVector3(_v3.setFromMatrixPosition(this.camera.matrix).sub(this.target));
            return spherical.phi;
        };

        this.getAzimuthalAngle = function () {
            const spherical = new Spherical();
            spherical.setFromVector3(_v3.setFromMatrixPosition(this.camera.matrix).sub(this.target));
            return spherical.theta;
        };

        this.saveState = function () {
            this.target0.copy(this.target);
            this.position0.copy(this.camera.position);
            this.zoom0 = this.camera.zoom;
        };

        this.reset = function () {
            this.target.copy(this.target0);
            this.camera.position.copy(this.position0);
            this.camera.zoom = this.zoom0;

            this.camera.updateProjectionMatrix();
            this.dispatchEvent(changeEvent);

            this.update();

            state = STATE.NONE;
        };

        // private variables
        const state = STATE.NONE;
        const scope = this;

        const EPS = 0.000001;

        // current position in spherical coordinates
        const spherical = new Spherical();
        const sphericalDelta = new Spherical();

        let scale = 1;
        const panOffset = new Vector3();

        const rotateStart = new Vector2();
        const rotateEnd = new Vector2();
        const rotateDelta = new Vector2();

        const panStart = new Vector2();
        const panEnd = new Vector2();
        const panDelta = new Vector2();

        const dollyStart = new Vector2();
        const dollyEnd = new Vector2();
        const dollyDelta = new Vector2();

        const _v3 = new Vector3();
        const _offset = new Vector3();
        const _quaternion = new Quaternion();
        const _quaternionInverse = new Quaternion();
        const _lastPosition = new Vector3();
        const _lastQuaternion = new Quaternion();

        // events
        const changeEvent = { type: 'change' };
        const startEvent = { type: 'start' };
        const endEvent = { type: 'end' };

        // pass in x,y of change desired in pixel space,
        // right and down are positive
        function pan(deltaX, deltaY) {
            const element = scope.domElement === document ? scope.domElement.body : scope.domElement;

            if (scope.camera.isPerspectiveCamera) {
                // perspective
                const position = scope.camera.position;
                _offset.copy(position).sub(scope.target);
                let targetDistance = _offset.length();

                // half of the fov is center to top of screen
                targetDistance *= Math.tan((scope.camera.fov / 2) * Math.PI / 180.0);

                // we actually don't use screenWidth, since perspective camera is fixed to screen height
                panLeft(2 * deltaX * targetDistance / element.clientHeight, scope.camera.matrix);
                panUp(2 * deltaY * targetDistance / element.clientHeight, scope.camera.matrix);
            } else if (scope.camera.isOrthographicCamera) {
                // orthographic
                panLeft(deltaX * (scope.camera.right - scope.camera.left) / scope.camera.zoom / element.clientWidth, scope.camera.matrix);
                panUp(deltaY * (scope.camera.top - scope.camera.bottom) / scope.camera.zoom / element.clientHeight, scope.camera.matrix);
            } else {
                // camera neither orthographic nor perspective
                console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
                scope.enablePan = false;
            }
        }

        function dollyIn(dollyScale) {
            if (scope.camera.isPerspectiveCamera) {
                scale /= dollyScale;
            } else if (scope.camera.isOrthographicCamera) {
                scope.camera.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.camera.zoom * dollyScale));
                scope.camera.updateProjectionMatrix();
                zoomChanged = true;
            } else {
                console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
                scope.enableZoom = false;
            }
        }

        function dollyOut(dollyScale) {
            if (scope.camera.isPerspectiveCamera) {
                scale *= dollyScale;
            } else if (scope.camera.isOrthographicCamera) {
                scope.camera.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.camera.zoom / dollyScale));
                scope.camera.updateProjectionMatrix();
                zoomChanged = true;
            } else {
                console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
                scope.enableZoom = false;
            }
        }

        //
        // event callbacks - update the object state
        //

        function handleMouseDownRotate(event) {
            //console.log( 'handleMouseDownRotate' );

            rotateStart.set(event.clientX, event.clientY);
        }

        function handleMouseDownDolly(event) {
            //console.log( 'handleMouseDownDolly' );

            dollyStart.set(event.clientX, event.clientY);
        }

        function handleMouseDownPan(event) {
            //console.log( 'handleMouseDownPan' );

            panStart.set(event.clientX, event.clientY);
        }

        function handleMouseMoveRotate(event) {
            //console.log( 'handleMouseMoveRotate' );

            rotateEnd.set(event.clientX, event.clientY);

            rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);

            const element = scope.domElement === document ? scope.domElement.body : scope.domElement;
            sphericalDelta.theta -= 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed;
            sphericalDelta.phi -= 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed;

            rotateStart.copy(rotateEnd);

            scope.update();
        }

        function handleMouseMoveDolly(event) {
            //console.log( 'handleMouseMoveDolly' );

            dollyEnd.set(event.clientX, event.clientY);

            dollyDelta.subVectors(dollyEnd, dollyStart);

            if (dollyDelta.y > 0) {
                dollyIn(getZoomScale());
            } else if (dollyDelta.y < 0) {
                dollyOut(getZoomScale());
            }

            dollyStart.copy(dollyEnd);

            scope.update();
        }

        function handleMouseMovePan(event) {
            //console.log( 'handleMouseMovePan' );

            panEnd.set(event.clientX, event.clientY);

            panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);

            pan(panDelta.x, panDelta.y);

            panStart.copy(panEnd);

            scope.update();
        }

        function handleMouseUp(event) {
            // console.log( 'handleMouseUp' );
        }

        function handleMouseWheel(event) {
            // console.log( 'handleMouseWheel' );

            if (event.deltaY < 0) {
                dollyOut(getZoomScale());
            } else if (event.deltaY > 0) {
                dollyIn(getZoomScale());
            }

            scope.update();
        }

        function handleKeyDown(event) {
            //console.log( 'handleKeyDown' );

            let needsUpdate = false;

            switch (event.keyCode) {
                case scope.keys.UP:
                    pan(0, scope.keyPanSpeed);
                    needsUpdate = true;
                    break;

                case scope.keys.BOTTOM:
                    pan(0, -scope.keyPanSpeed);
                    needsUpdate = true;
                    break;

                case scope.keys.LEFT:
                    pan(scope.keyPanSpeed, 0);
                    needsUpdate = true;
                    break;

                case scope.keys.RIGHT:
                    pan(-scope.keyPanSpeed, 0);
                    needsUpdate = true;
                    break;
            }

            if (needsUpdate) {
                // prevent the browser from scrolling on page up/down
                event.preventDefault();

                scope.update();
            }
        }

        function handleTouchStartRotate(event) {
            //console.log( 'handleTouchStartRotate' );

            rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
        }

        function handleTouchStartDollyPan(event) {
            //console.log( 'handleTouchStartDollyPan' );

            if (event.touches.length === 1) {
                // one-fingered touch: pan
                panStart.set(event.touches[0].pageX, event.touches[0].pageY);
            } else if (event.touches.length === 2) {
                // two-fingered touch: dolly
                const dx = event.touches[0].pageX - event.touches[1].pageX;
                const dy = event.touches[0].pageY - event.touches[1].pageY;

                const distance = Math.sqrt(dx * dx + dy * dy);

                dollyStart.set(0, distance);
            }
        }

        function handleTouchMoveRotate(event) {
            //console.log( 'handleTouchMoveRotate' );

            rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);

            rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);

            const element = scope.domElement === document ? scope.domElement.body : scope.domElement;
            sphericalDelta.theta -= 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed;
            sphericalDelta.phi -= 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed;

            rotateStart.copy(rotateEnd);

            scope.update();
        }

        function handleTouchMoveDollyPan(event) {
            //console.log( 'handleTouchMoveDollyPan' );

            if (event.touches.length === 1) {
                // one-fingered touch: pan
                panEnd.set(event.touches[0].pageX, event.touches[0].pageY);

                panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);

                pan(panDelta.x, panDelta.y);

                panStart.copy(panEnd);
            } else if (event.touches.length === 2) {
                // two-fingered touch: dolly
                const dx = event.touches[0].pageX - event.touches[1].pageX;
                const dy = event.touches[0].pageY - event.touches[1].pageY;

                const distance = Math.sqrt(dx * dx + dy * dy);

                dollyEnd.set(0, distance);

                dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, scope.zoomSpeed));
                dollyIn(dollyDelta.y);

                dollyStart.copy(dollyEnd);
            }

            scope.update();
        }

        function handleTouchEnd(event) {
            //console.log( 'handleTouchEnd' );
        }

        //
        // event handlers - FSM: listen for events and reset state
        //

        function onMouseDown(event) {
            if (scope.enabled === false) return;

            event.preventDefault();

            if (event.button === scope.mouseButtons.LEFT) {
                if (scope.enableRotate === false) return;

                state = STATE.ROTATE;

                handleMouseDownRotate(event);
            } else if (event.button === scope.mouseButtons.MIDDLE) {
                if (scope.enableDolly === false) return;

                state = STATE.DOLLY;

                handleMouseDownDolly(event);
            } else if (event.button === scope.mouseButtons.RIGHT) {
                if (scope.enablePan === false) return;

                state = STATE.PAN;

                handleMouseDownPan(event);
            }
        }

        function onMouseMove(event) {
            if (scope.enabled === false) return;

            event.preventDefault();

            if (state === STATE.ROTATE) {
                if (scope.enableRotate === false) return;

                handleMouseMoveRotate(event);
            } else if (state === STATE.DOLLY) {
                if (scope.enableDolly === false) return;

                handleMouseMoveDolly(event);
            } else if (state === STATE.PAN) {
                if (scope.enablePan === false) return;

                handleMouseMovePan(event);
            }
        }

        function onMouseUp(event) {
            if (scope.enabled === false) return;

            handleMouseUp(event);

            state = STATE.NONE;
        }

        function onMouseWheel(event) {
            if (scope.enabled === false || scope.enableZoom === false || (state !== STATE.NONE && state !== STATE.ROTATE)) return;

            event.preventDefault();
            event.stopPropagation();

            handleMouseWheel(event);
        }

        function onKeyDown(event) {
            if (scope.enabled === false || scope.enableKeys === false || scope.enablePan === false) return;

            handleKeyDown(event);
        }

        function onTouchStart(event) {
            if (scope.enabled === false) return;

            event.preventDefault();

            if (event.touches.length === 1) {
                // one-fingered touch: rotate
                if (scope.enableRotate === false) return;

                state = STATE.TOUCH_ROTATE;

                handleTouchStartRotate(event);
            } else if (event.touches.length === 2) {
                // two-fingered touch: dolly-pan
                if (scope.enableZoom === false && scope.enablePan === false) return;

                state = STATE.TOUCH_DOLLY_PAN;

                handleTouchStartDollyPan(event);
            }
        }

        function onTouchMove(event) {
            if (scope.enabled === false) return;

            event.preventDefault();
            event.stopPropagation();

            if (state === STATE.TOUCH_ROTATE) {
                if (scope.enableRotate === false) return;

                handleTouchMoveRotate(event);
            } else if (state === STATE.TOUCH_DOLLY_PAN) {
                if (scope.enableZoom === false && scope.enablePan === false) return;

                handleTouchMoveDollyPan(event);
            }
        }

        function onTouchEnd(event) {
            if (scope.enabled === false) return;

            handleTouchEnd(event);

            state = STATE.NONE;
        }

        function onContextMenu(event) {
            if (scope.enabled === false) return;

            event.preventDefault();
        }

        //

        scope.domElement.addEventListener('contextmenu', onContextMenu, false);

        scope.domElement.addEventListener('mousedown', onMouseDown, false);
        scope.domElement.addEventListener('wheel', onMouseWheel, false);
        scope.domElement.addEventListener('touchstart', onTouchStart, false);

        scope.domElement.addEventListener('touchend', onTouchEnd, false);
        scope.domElement.addEventListener('touchmove', onTouchMove, false);

        scope.domElement.addEventListener('mousemove', onMouseMove, false);
        scope.domElement.addEventListener('mouseup', onMouseUp, false);

        // force an update at start
        this.update();
    }

    update() {
        const offset = new Vector3();

        // so camera.up is the orbit axis
        const quat = new Quaternion().setFromUnitVectors(this.camera.up, new Vector3(0, 1, 0));
        const quatInverse = quat.clone().invert();

        const lastPosition = new Vector3();
        const lastQuaternion = new Quaternion();

        return function update() {
            const position = this.camera.position;

            offset.copy(position).sub(this.target);

            // rotate offset to "y-axis-is-up" space
            offset.applyQuaternion(quat);

            // angle from z-axis around y-axis
            spherical.setFromVector3(offset);

            if (this.autoRotate && state === STATE.NONE) {
                rotateLeft(getAutoRotationAngle());
            }

            spherical.theta += sphericalDelta.theta;
            spherical.phi += sphericalDelta.phi;

            // restrict theta to be between desired limits
            spherical.theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, spherical.theta));

            // restrict phi to be between desired limits
            spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, spherical.phi));

            spherical.makeSafe();

            spherical.radius *= scale;

            // restrict radius to be between desired limits
            spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, spherical.radius));

            // move target to panned location
            this.target.add(panOffset);

            offset.setFromSpherical(spherical);

            // rotate offset back to "camera-up-vector-is-up" space
            offset.applyQuaternion(quatInverse);

            position.copy(this.target).add(offset);

            this.camera.lookAt(this.target);

            if (this.enableDamping === true) {
                sphericalDelta.theta *= (1 - this.dampingFactor);
                sphericalDelta.phi *= (1 - this.dampingFactor);
                panOffset.multiplyScalar(1 - this.dampingFactor);
            } else {
                sphericalDelta.set(0, 0, 0);
                panOffset.set(0, 0, 0);
            }

            scale = 1;

            // update condition is:
            // min(camera displacement, camera rotation in radians)^2 > EPS
            // using small-angle approximation cos(x/2) = 1 - x^2 / 8

            if (zoomChanged ||
                lastPosition.distanceToSquared(this.camera.position) > EPS ||
                8 * (1 - lastQuaternion.dot(this.camera.quaternion)) > EPS) {
                this.dispatchEvent(changeEvent);

                lastPosition.copy(this.camera.position);
                lastQuaternion.copy(this.camera.quaternion);
                zoomChanged = false;

                return true;
            }

            return false;
        };
    }
}

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one-finger rotate
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - right mouse, or left mouse + ctrl / touch: two-finger move

const STATE = {
    NONE: - 1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
    TOUCH_ROTATE: 3,
    TOUCH_DOLLY_PAN: 6
};

function Spherical() {
    this.radius = 1;

    // polar angle
    this.phi = 0;

    // azimuthal angle
    this.theta = 0;
}

Object.assign(Spherical.prototype, {
    set: function (radius, phi, theta) {
        this.radius = radius;
        this.phi = phi;
        this.theta = theta;

        return this;
    },

    clone: function () {
        return new Spherical().copy(this);
    },

    copy: function (other) {
        this.radius = other.radius;
        this.phi = other.phi;
        this.theta = other.theta;

        return this;
    },

    makeSafe: function () {
        this.phi = Math.max(EPS, Math.min(Math.PI - EPS, this.phi));

        return this;
    },

    setFromVector3: function (v) {
        return this.setFromCartesianCoords(v.x, v.y, v.z);
    },

    setFromCartesianCoords: function (x, y, z) {
        this.radius = Math.sqrt(x * x + y * y + z * z);

        if (this.radius === 0) {
            this.theta = 0;
            this.phi = 0;
        } else {
            this.theta = Math.atan2(x, z);
            this.phi = Math.acos(clamp(y / this.radius, - 1, 1));
        }

        return this;
    }
});

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getAutoRotationAngle() {
    return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
}

function getZoomScale() {
    return Math.pow(0.95, scope.zoomSpeed);
}

function rotateLeft(angle) {
    sphericalDelta.theta -= angle;
}

function rotateUp(angle) {
    sphericalDelta.phi -= angle;
}

const panLeft = function () {
    const v = new Vector3();
    return function panLeft(distance, objectMatrix) {
        v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
        v.multiplyScalar(- distance);

        panOffset.add(v);
    };
}();

const panUp = function () {
    const v = new Vector3();
    return function panUp(distance, objectMatrix) {
        if (scope.screenSpacePanning === true) {
            v.setFromMatrixColumn(objectMatrix, 1);
        } else {
            v.setFromMatrixColumn(objectMatrix, 0);
            v.crossVectors(scope.camera.up, v);
        }

        v.multiplyScalar(distance);

        panOffset.add(v);
    };
}();

// pass in distance in world space to move left
function pan(deltaX, deltaY) {
    const element = scope.domElement === document ? scope.domElement.body : scope.domElement;

    if (scope.camera.isPerspectiveCamera) {
        // perspective
        const position = scope.camera.position;
        _offset.copy(position).sub(scope.target);
        let targetDistance = _offset.length();

        // half of the fov is center to top of screen
        targetDistance *= Math.tan((scope.camera.fov / 2) * Math.PI / 180.0);

        // we actually don't use screenWidth, since perspective camera is fixed to screen height
        panLeft(2 * deltaX * targetDistance / element.clientHeight, scope.camera.matrix);
        panUp(2 * deltaY * targetDistance / element.clientHeight, scope.camera.matrix);
    } else if (scope.camera.isOrthographicCamera) {
        // orthographic
        panLeft(deltaX * (scope.camera.right - scope.camera.left) / scope.camera.zoom / element.clientWidth, scope.camera.matrix);
        panUp(deltaY * (scope.camera.top - scope.camera.bottom) / scope.camera.zoom / element.clientHeight, scope.camera.matrix);
    } else {
        // camera neither orthographic nor perspective
        console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
        scope.enablePan = false;
    }
}

export { OrbitControls }; 