<script lang="ts">

    import { AutoColliders, RigidBody } from "@threlte/rapier";

    import type * as rapier3d from '@dimforge/rapier3d-compat';

    import { T } from "@threlte/core";
    import type { PositionUpdate } from '$lib/network/network-types';
    import { AudioListener } from '@threlte/extras';
    import PlayerMovement from '$lib/player/PlayerMovement.svelte';
    import { useNetworker } from '$lib/network';
    import PlayerMesh from './PlayerMesh.svelte';
    import CameraLock from './CameraLock.svelte';

    let networker = useNetworker();

    let rigidBody: rapier3d.RigidBody;

    let _ = networker;

    let movementController: PlayerMovement;
    let pointerController: CameraLock;

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
        pointerController.lock();
    };

</script>

<T.Group>
    <RigidBody type="dynamic" let:rigidBody bind:rigidBody={rigidBody} linearDamping={0.1}>
        <AutoColliders shape="capsule" friction={1.0}>
            <PlayerMesh />
        </AutoColliders>

        <T.PerspectiveCamera let:ref={camera} makeDefault position.y={0.25}>
            <PlayerMovement bind:this={movementController}/>
            <CameraLock bind:this={pointerController}/>
            <AudioListener />
            <slot {rigidBody} {networker} {camera}/>        
        </T.PerspectiveCamera>
    </RigidBody>
</T.Group>

