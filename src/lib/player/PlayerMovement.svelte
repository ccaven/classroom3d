<script lang="ts">
    import RAPIER, { QueryFilterFlags } from "@dimforge/rapier3d-compat";
    import type { NetworkManager } from "$lib/network/Networker.svelte";
    import { T, useParent, useThrelte } from "@threlte/core";
    import { Collider, CollisionGroups, useRapier } from "@threlte/rapier";
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import * as THREE from "three";
    import { DEG2RAD } from "three/src/math/MathUtils";
    import { useNetworker } from "$lib/network";

    export let rigidBody: RAPIER.RigidBody;
    export let camera: THREE.PerspectiveCamera;
    export let pointerSpeed: number = 1.0;

    let networker = useNetworker();
    let { world } = useRapier();
    let grounded = false;
    let canJump = false;
    let isLocked = false;

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

    function respawn() {
        rigidBody.setTranslation({ x: 0, y: 10, z: 0 }, true);
        rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
    
    function checkGrounded() {
        let hit = world.castShape(
            rigidBody.translation(), 
            rigidBody.rotation(), 
            { x: 0, y: -1, z: 0 }, 
            new RAPIER.Capsule(0.75 / 2, 0.29), 0.1, 
            true, undefined, undefined, undefined, rigidBody);
        grounded = (hit && hit.toi < 0.01) ? true : false;
    }

    function jump() {
        if (grounded && pressedKeys.get(" ")) {
            const linvel = rigidBody.linvel();
            linvel.y = 0;
            rigidBody.setLinvel(linvel, true);

            rigidBody.applyImpulse({
                x: 0, y: 2, z: 0
            }, true);

            canJump = false;
        }
    }

    function getInputVector() {
        let x = 0;
        let z = 0;

        if (pressedKeys.get("w")) z -= 1;
        if (pressedKeys.get("s")) z += 1;
        if (pressedKeys.get("a")) x -= 1;
        if (pressedKeys.get("d")) x += 1;

        return { x, z };
    }
    
    function applyMovementVector() {

        // This can be moved into a getInputVector
        let movementScale = 0.4;

        let { x, z } = getInputVector();

        const forward = new THREE.Vector3();

        camera.getWorldDirection(forward).setY(0).normalize();
        
        const right = forward.clone().cross(new THREE.Vector3(0, 1, 0));

        if (grounded) {
            // Ground-based movement
            const movementVector = forward
                .multiplyScalar(-z)
                .addScaledVector(right, x)
                .normalize()
                .multiplyScalar(movementScale);
            rigidBody.applyImpulse(movementVector, true);
        } else {
            // Air-based movement
            // TODO
        }
    }

    function applyFrictionVector() {
        if (grounded) {
            const linvel = rigidBody.linvel();

            rigidBody.applyImpulse({
                x: -linvel.x * 0.05,
                y: 0,
                z: -linvel.z * 0.05
            }, true);
        }
        
    }

    let then = performance.now();
    function loop() {

        let now = performance.now();
        let dt = (now - then) * 0.001;
        then = now;

        checkGrounded();

        applyMovementVector();

        applyFrictionVector();

        jump();
        
        if (pressedKeys.get("r")) respawn();

        requestAnimationFrame(loop);
    }

    onMount(() => {
        requestAnimationFrame(loop);
    });


</script>

