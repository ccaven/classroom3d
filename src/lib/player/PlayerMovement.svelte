<script lang="ts">
    import RAPIER from "@dimforge/rapier3d-compat";
    import { useParent, useThrelte } from "@threlte/core";
    import { useRapier, useRigidBody } from "@threlte/rapier";
    import { onDestroy, onMount } from "svelte";
    import * as THREE from "three";
    import type { Writable } from "svelte/store";

    let rigidBody = useRigidBody() as RAPIER.RigidBody;
    let camera = useParent() as Writable<THREE.PerspectiveCamera>;

    let { world } = useRapier();
    let grounded = false;
    let canJump = false;

    const { renderer } = useThrelte()

    if (!renderer) throw new Error("Renderer not found");

    const domElement: HTMLCanvasElement = renderer.domElement;

    domElement.ownerDocument.addEventListener("keydown", onKeyDown);
    domElement.ownerDocument.addEventListener("keyup", onKeyUp);

    onDestroy(() => {
        domElement.ownerDocument.removeEventListener("keydown", onKeyDown);
        domElement.ownerDocument.removeEventListener("keyup", onKeyUp);
    });

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

        $camera.getWorldDirection(forward).setY(0).normalize();
        
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

    export function usePlayerRigidBody() { return rigidBody; }
    export function useCameraPosition() { return $camera.position; }
    

</script>

