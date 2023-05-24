<script lang="ts">

    import * as THREE from 'three';

    import type { NetworkManager } from "./Networker.svelte";

    import { AutoColliders, RigidBody } from "@threlte/rapier";

    import type * as rapier3d from '@dimforge/rapier3d-compat';

    import { T } from "@threlte/core";
    import { onMount } from 'svelte';
    import type { PositionUpdate } from './network-types';
    import { AudioListener, useAudioListener } from '@threlte/extras';
    import PlayerMovement from './PlayerMovement.svelte';

    export let networker: NetworkManager;

    let rigidBody: rapier3d.RigidBody;

    const {
        Mesh,
        Group,
        BoxGeometry,
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

    }, 1000 / 5);

    onclick = () => {
        movementController.lock();

        rigidBody?.setTranslation({
            x: Math.random() * 2 - 1,
            y: 0,
            z: Math.random() * 2 - 1
        }, true);

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
        <AutoColliders shape="cuboid" friction={1.0}>
            <Mesh receiveShadow>
                <BoxGeometry args={[0.25, 1, 0.25]}/>
                <MeshStandardMaterial color="green"/>
            </Mesh>
        </AutoColliders>

        <T.PerspectiveCamera let:ref={camera} makeDefault position={[0, 0, 0]}>
            <PlayerMovement {networker} {camera} {rigidBody} bind:this={movementController}/>
            <AudioListener />
            <slot {rigidBody} {networker} {camera}/>        
        </T.PerspectiveCamera>
    </RigidBody>
</Group>

