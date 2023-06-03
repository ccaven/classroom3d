<script lang="ts">
    import * as THREE from 'three';

    import type Player from "$lib/player/Player.svelte";
    import { T, useThrelte } from "@threlte/core";
    import { useCursor, interactivity } from "@threlte/extras";
    import { getContext, onMount } from "svelte";
    import type { Writable } from "svelte/store";
    import { Vector2 } from "three";
    import { setInteractiveManager, useInteractiveManager, usePlayerWritable } from '$lib/helper';

    interactivity();

    let manager = setInteractiveManager();

    let pointerInside = false;
    let isFocused = false;

    let player = usePlayerWritable();

    document.addEventListener("keydown", e => {
        if (pointerInside && e.key.toString() == "e") {
            console.log("Starting interactvity!");
            $player.useCameraController().requestFocus(
                manager.getPosition(),
                manager.getTarget()
            );
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
        <T.Mesh position.y={2}>

            <T.BoxGeometry args={[1, 1, 1]}/>
            <T.MeshStandardMaterial args={[{ color: "blue" }]}/>

        </T.Mesh>

    {/if}

</T.Group>