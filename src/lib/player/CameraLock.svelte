<script lang="ts">
    import type RAPIER from "@dimforge/rapier3d-compat";

    import { useParent, useThrelte } from "@threlte/core";
    import { onDestroy } from "svelte";
    import type { Writable } from "svelte/store";
    import * as THREE from 'three';
    import { DEG2RAD } from "three/src/math/MathUtils";

    // export let camera: THREE.PerspectiveCamera;
    export let pointerSpeed: number = 1.0;

    let camera = useParent() as Writable<THREE.PerspectiveCamera>;

    const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
    const minPolarAngle = 100 * DEG2RAD;
    const maxPolarAngle = 170 * DEG2RAD;
    const _PI_2 = Math.PI * 0.75; 
    let isLocked = false;

    const { renderer, invalidate } = useThrelte();

    if (!renderer) throw new Error("Renderer not found");

    const domElement: HTMLCanvasElement = renderer.domElement;

    export const lock = () => domElement.requestPointerLock();
    export const unlock = () => domElement.ownerDocument.exitPointerLock();

    domElement.addEventListener("mousemove", onMouseMove);
    domElement.ownerDocument.addEventListener("pointerlockchange", onPointerLockChange);
    domElement.ownerDocument.addEventListener("pointerlockerror", onPointerLockError);

    onDestroy(() => {
        domElement.removeEventListener("mousemove", onMouseMove);
        domElement.ownerDocument.removeEventListener("pointerlockchange", onPointerLockChange);
        domElement.ownerDocument.removeEventListener("pointerlockerror", onPointerLockError);
    });
    
    function onMouseMove(event: MouseEvent) {
        if (!isLocked) return;
        if (!camera) return;

        const { movementX, movementY } = event

        _euler.setFromQuaternion($camera.quaternion)

        _euler.y -= movementX * 0.002 * pointerSpeed;
        _euler.x -= movementY * 0.002 * pointerSpeed;

        _euler.x = Math.max(_PI_2 - maxPolarAngle, Math.min(_PI_2 - minPolarAngle, _euler.x));

        $camera.quaternion.setFromEuler(_euler);

        invalidate('PointerLockControls: change event')
    }

    function onPointerLockChange() {
        isLocked = document.pointerLockElement == domElement;
    }

    function onPointerLockError() {
        console.log("Unable to use the pointer lock API");
    }
</script>