<script lang="ts">

    import { AutoColliders, RigidBody } from "@threlte/rapier";

    import type * as rapier3d from '@dimforge/rapier3d-compat';

    import { T } from "@threlte/core";
    import type { PositionUpdate } from '$lib/network/network-types';
    import { AudioListener } from '@threlte/extras';
    import PlayerMovement from '$lib/player/PlayerMovement.svelte';
    import { useNetworker } from '$lib/network';
    import PlayerMesh from './PlayerMesh.svelte';
    import PlayerCamera from "./PlayerCamera.svelte";

    let networker = useNetworker();

    let rigidBody: rapier3d.RigidBody;

    let camera: THREE.PerspectiveCamera;

    let _ = networker;

    let movementController: PlayerMovement;
    let cameraController: PlayerCamera;

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

    export function useCamera() { return camera; }
    export function useMovementController() { return movementController; }
    export function useCameraController() { return cameraController; }

</script>

<T.Group>
    <RigidBody type="dynamic" let:rigidBody bind:rigidBody={rigidBody} linearDamping={0.1}>
        <AutoColliders shape="capsule" friction={1.0}>
            <PlayerMesh visible={false}/>
        </AutoColliders>

        <T.PerspectiveCamera bind:ref={camera} makeDefault position.y={0.25} args={[90]}>
            <PlayerMovement bind:this={movementController}/>
            <PlayerCamera bind:this={cameraController}/>
            <AudioListener />
            <slot {rigidBody} {networker} {camera}/>        
        </T.PerspectiveCamera>
    </RigidBody>
</T.Group>

