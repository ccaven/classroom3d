<script lang="ts">

    import * as THREE from 'three';

    import type { NetworkManager } from "./Networker.svelte";

    import { AutoColliders, RigidBody } from "@threlte/rapier";

    import type * as rapier3d from '@dimforge/rapier3d-compat';

    import { T } from "@threlte/core";
    import { onMount } from 'svelte';
    import type { PositionUpdate } from './network-types';
    import { AudioListener, useAudioListener } from '@threlte/extras';

    export let networker: NetworkManager;

    const { context } = useAudioListener()

    let rigidBody: rapier3d.RigidBody;

    const {
        Mesh,
        Group,
        BoxGeometry,
        MeshStandardMaterial,
        SphereGeometry
    } = T;

    let _ = networker;

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
    
    function normalized({ x, y, z, w }: rapier3d.Quaternion) {
        let m = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w);
        return {
            x: x * m,
            y: y * m,
            z: z * m,
            w: w * m
        };
    }

    onclick = () => {
        rigidBody.setTranslation({
            x: Math.random() * 2 - 1,
            y: 0,
            z: Math.random() * 2 - 1
        }, true);

        rigidBody.setRotation(normalized({
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1,
            z: Math.random() * 2 - 1,
            w: Math.random() * 2 - 1
        }), true);
    };

</script>

<Group>
    <RigidBody type="dynamic" bind:rigidBody={rigidBody}>
        <AutoColliders shape="cuboid">
            <Mesh receiveShadow>
                <BoxGeometry args={[0.5, 0.5, 0.5]}/>
                <MeshStandardMaterial color="green"/>
            </Mesh>
        </AutoColliders>
    </RigidBody>

    
</Group>

