<script lang="ts">
    import { useParent, useThrelte } from "@threlte/core";
    import { onDestroy } from "svelte";
    import type { Writable } from "svelte/store";
    import * as THREE from 'three';
    import { DEG2RAD } from "three/src/math/MathUtils";

    export let pointerSpeed: number = 1.0;
    export let angleRange = { min: 100 * DEG2RAD, max: 170 * DEG2RAD };

    let camera = useParent() as Writable<THREE.PerspectiveCamera>;

    let isLocked = false;
    let isFocused = false;

    const { renderer, invalidate } = useThrelte();

    if (!renderer) throw new Error("Renderer not found");

    const domElement: HTMLCanvasElement = renderer.domElement;
    
    const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
    const _PI_2 = Math.PI * 0.75; 
    function onMouseMove(event: MouseEvent) {
        if (!isLocked) return;
        if (!camera) return;

        const { movementX, movementY } = event;

        _euler.setFromQuaternion($camera.quaternion);

        _euler.y -= movementX * 0.002 * pointerSpeed;
        _euler.x -= movementY * 0.002 * pointerSpeed;

        _euler.x = Math.max(_PI_2 - angleRange.max, Math.min(_PI_2 - angleRange.min, _euler.x));

        $camera.quaternion.setFromEuler(_euler);

        invalidate('PointerLockControls: change event')
    }

    function onPointerLockChange() {
        isLocked = document.pointerLockElement == domElement;
    }

    function onPointerLockError() {
        console.log("Unable to use the pointer lock API");
    }

    export const lock = () => domElement.requestPointerLock();
    export const unlock = () => domElement.ownerDocument.exitPointerLock();

    let { scene } = useThrelte();
    let savedQuaternion = new THREE.Quaternion(1, 0, 0, 0);
    export function requestFocus(position: THREE.Vector3, target: THREE.Vector3) {
        
        if (isFocused) return false;

        isFocused = true;
        unlock();

        savedQuaternion.copy($camera.quaternion);

        let worldPosition = new THREE.Vector3();
        $camera.getWorldPosition(worldPosition);

        console.log(worldPosition.sub(position));

        $camera.position.sub(worldPosition);

        $camera.getWorldPosition(worldPosition);

        console.log(worldPosition);
        console.log(position);
        
        $camera.lookAt(target);

        return true;

    }

    document.addEventListener("keydown", e => {
        if (e.key == "Escape") {
            console.log("Exiting focus");
            isFocused = false;

            $camera.position.set(0, 0.25, 0);
            $camera.quaternion.copy(savedQuaternion);
            setTimeout(lock, 100);
        }
    });

    domElement.addEventListener("click", () => {
        if (!isFocused) lock();
    });

    domElement.addEventListener("mousemove", onMouseMove);
    domElement.ownerDocument.addEventListener("pointerlockchange", onPointerLockChange);
    domElement.ownerDocument.addEventListener("pointerlockerror", onPointerLockError);

    onDestroy(() => {
        domElement.removeEventListener("mousemove", onMouseMove);
        domElement.ownerDocument.removeEventListener("pointerlockchange", onPointerLockChange);
        domElement.ownerDocument.removeEventListener("pointerlockerror", onPointerLockError);
    });

</script>