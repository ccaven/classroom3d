<script lang="ts">

    import * as THREE from 'three';

    import type { NetworkManager } from "$lib/network/Networker.svelte";

    import { AutoColliders, Collider, RigidBody } from "@threlte/rapier";

    import type * as rapier3d from '@dimforge/rapier3d-compat';

    import { T } from "@threlte/core";
    import { onMount } from 'svelte';
    import type { PositionUpdate } from '$lib/network/network-types';
    import { AudioListener, useAudioListener } from '@threlte/extras';
    import PlayerMovement from '$lib/player/PlayerMovement.svelte';
    import { useNetworker } from '$lib/network';
    import PlayerMesh from './PlayerMesh.svelte';

    let networker = useNetworker();

    let rigidBody: rapier3d.RigidBody;

    const {
        Mesh,
        Group,
        CapsuleGeometry,
        MeshStandardMaterial
    } = T;

    let _ = networker;

    let movementController: PlayerMovement;

    $: if (rigidBody) rigidBody.lockRotations(true, false);

    setInterval(() => {

        if (rigidBody) {
            let position = rigidBody.translation();
            let velocity = rigidBody.linvel();
            let rotation = rigidBody.rotation();

            networker.broadcast<PositionUpdate>("position-update", {
                position, velocity, rotation
            });
        }

    }, 1000 / 20);

    onclick = () => {
        movementController.lock();
        
        /*
        rigidBody?.setRotation(normalized({
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1,
            z: Math.random() * 2 - 1,
            w: Math.random() * 2 - 1
        }), true);
        */
    };

</script>

<Group>
    <RigidBody type="dynamic" let:rigidBody bind:rigidBody={rigidBody} linearDamping={0.1}>
        <AutoColliders shape="capsule" friction={1.0}>
            <PlayerMesh />
        </AutoColliders>

        <T.PerspectiveCamera let:ref={camera} makeDefault position.y={0.25}>
            <PlayerMovement {camera} {rigidBody} bind:this={movementController}/>
            <AudioListener />
            <slot {rigidBody} {networker} {camera}/>        
        </T.PerspectiveCamera>
    </RigidBody>
</Group>

