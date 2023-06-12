<script lang="ts">
    import * as THREE from 'three';
    import { T } from "@threlte/core";
    import { interactivity } from "@threlte/extras";
    import { usePlayerWritable } from '$lib/helper';

    export let focusedCameraPosition: () => THREE.Vector3 = () => new THREE.Vector3(0, 0, 0);
    export let focusedCameraTarget: () => THREE.Vector3 = () => new THREE.Vector3(0, 0, -1);

    interactivity();

    let pointerInside = false;
    let player = usePlayerWritable();

    document.addEventListener("keydown", e => {
        if (pointerInside && e.key.toString() == "e") {
            const p = focusedCameraPosition();
            const t = focusedCameraTarget();

            console.log("p", p);
            console.log("t", t);
            $player.useCameraController().requestFocus(p, t);
        }
    });


</script>

<T.Group
    on:pointerenter={() => { pointerInside = true; }}
    on:pointerleave={() => { pointerInside = false; }}
>
    <slot></slot>

    {#if pointerInside}

        <!-- Give interaction hint -->
        <T.Mesh position.y={1}>

            <T.BoxGeometry args={[1, 1, 1]}/>
            <T.MeshStandardMaterial args={[{ color: "blue" }]}/>

        </T.Mesh>

    {/if}

</T.Group>