<script lang="ts">
    import RAPIER, { QueryFilterFlags } from "@dimforge/rapier3d-compat";
    import type { NetworkManager } from "./Networker.svelte";
    import { T, useParent, useThrelte } from "@threlte/core";
    import { Collider, CollisionGroups, useRapier } from "@threlte/rapier";
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import * as THREE from "three";
    import { DEG2RAD } from "three/src/math/MathUtils";

    export let networker: NetworkManager;
    export let rigidBody: RAPIER.RigidBody;
    export let camera: THREE.PerspectiveCamera;
    export let pointerSpeed: number = 1.0;

    let _ = networker;

    let isLocked: boolean = false;

    const dispatch = createEventDispatcher()

    const { renderer, invalidate } = useThrelte();

    if (!renderer) throw new Error("Renderer not found");

    const domElement: HTMLCanvasElement = renderer.domElement;

    export const lock = () => domElement.requestPointerLock();
    export const unlock = () => domElement.ownerDocument.exitPointerLock();

    domElement.addEventListener("mousemove", onMouseMove);
    domElement.ownerDocument.addEventListener("pointerlockchange", onPointerLockChange);
    domElement.ownerDocument.addEventListener("pointerlockerror", onPointerLockError);
    domElement.ownerDocument.addEventListener("keydown", onKeyDown);
    domElement.ownerDocument.addEventListener("keyup", onKeyUp);

    onDestroy(() => {
        domElement.removeEventListener("mousemove", onMouseMove);
        domElement.ownerDocument.removeEventListener("pointerlockchange", onPointerLockChange);
        domElement.ownerDocument.removeEventListener("pointerlockerror", onPointerLockError);
        domElement.ownerDocument.removeEventListener("keydown", onKeyDown);
        domElement.ownerDocument.removeEventListener("keyup", onKeyUp);
    });

    const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
    const minPolarAngle = 10 * DEG2RAD;
    const maxPolarAngle = 170 * DEG2RAD;
    const _PI_2 = Math.PI * 0.75; 

    function onMouseMove(event: MouseEvent) {
        if (!isLocked) return;
        if (!rigidBody || !camera) return;

        const { movementX, movementY } = event

        _euler.setFromQuaternion(camera.quaternion)

        _euler.y -= movementX * 0.002 * pointerSpeed;
        _euler.x -= movementY * 0.002 * pointerSpeed;

        _euler.x = Math.max(_PI_2 - maxPolarAngle, Math.min(_PI_2 - minPolarAngle, _euler.x));

        camera.quaternion.setFromEuler(_euler);

        invalidate('PointerLockControls: change event')
        dispatch("change");
    }

    function onPointerLockChange() {
        if (document.pointerLockElement == domElement) {
            dispatch("lock");
            isLocked = true;
        } else {
            dispatch("unlock");
            isLocked = false;
        }
    }

    function onPointerLockError() {
        console.log("Unable to use the pointer lock API");
    }

    let pressedKeys = new Map<string, boolean>();
    function onKeyDown(event: KeyboardEvent) {
        pressedKeys.set(event.key, true);
    }
    function onKeyUp(event: KeyboardEvent) {
        pressedKeys.set(event.key, false);
    }

    let { world } = useRapier();
    let canJump = false;
    function jump() {
        // Perform downward raycast
        let ray = new RAPIER.Ray(rigidBody.translation(), { x: 0, y: -1, z: 0 });

        let filterFlags = QueryFilterFlags.EXCLUDE_DYNAMIC;
        let hit = world.castRay(ray, 4.0, false, undefined, undefined, undefined, rigidBody);
        
        if (hit) {
            let point = ray.pointAt(hit.toi);
            
        }

        if (hit && hit.toi < 0.50 && pressedKeys.get(" ")) {
            const linvel = rigidBody.linvel();
            linvel.y = 0;
            rigidBody.setLinvel(linvel, true);

            rigidBody.applyImpulse({
                x: 0, y: 0.5, z: 0
            }, true);
            console.log("jumped")

            canJump = false;
        }
    }

    function calculateMovementVector(): RAPIER.Vector {

        let movementScale = 0.1;

        let x = 0;
        let z = 0;

        if (pressedKeys.get("w")) z -= 1;
        if (pressedKeys.get("s")) z += 1;
        if (pressedKeys.get("a")) x -= 1;
        if (pressedKeys.get("d")) x += 1;

        const forward = new THREE.Vector3();

        camera.getWorldDirection(forward).setY(0).normalize();
        
        const right = forward.clone().cross(new THREE.Vector3(0, 1, 0));

        return forward
            .multiplyScalar(-z)
            .addScaledVector(right, x)
            .normalize()
            .multiplyScalar(movementScale);
    }

    function applyFrictionVector() {
        const linvel = rigidBody.linvel();

        rigidBody.applyImpulse({
            x: -linvel.x * 0.01,
            y: 0,
            z: -linvel.z * 0.01
        }, true);
        
    }

    let then = performance.now();
    function loop() {

        let now = performance.now();
        let dt = (now - then) * 0.001;
        then = now;

        const movementVector = calculateMovementVector();

        rigidBody.applyImpulse(movementVector, true);

        applyFrictionVector();

        jump();

        requestAnimationFrame(loop);
    }

    onMount(() => {
        requestAnimationFrame(loop);
    });


</script>

