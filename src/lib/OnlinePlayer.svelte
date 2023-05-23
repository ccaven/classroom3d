
<script lang="ts">
    import { spring } from "svelte/motion";
    import type * as rapier3d from '@dimforge/rapier3d-compat';
    import type { NetworkManager } from "./Networker.svelte";
    import type { PingUpdate, PositionUpdate } from "./network-types";
    import { T } from "@threlte/core";
    import { onDestroy, onMount } from "svelte";
    import { Audio, PositionalAudio } from "@threlte/extras";
    import type { Group } from "three";

    export let networker: NetworkManager;
    export let peerId: string;

    const {
        Mesh,
        BoxGeometry,
        MeshStandardMaterial,
        Group        
    } = T;

    const position = spring({ x: 0, y: 0, z: 0 }, { stiffness: 0.2 });
    const velocity = spring({ x: 0, y: 0, z: 0 }, { stiffness: 0.2 });
    const rotation = spring({ x: 0, y: 0, z: 0, w: 0 }, { stiffness: 0.2 });

    function updateCallback(payload: PositionUpdate["payload"]) {
        $position = payload.position;
        $velocity = payload.velocity;
        $rotation = payload.rotation;
    }

    let timeSinceLastPing: number = 0;
    let maxTimeSinceLastPing = 15;
    function pingCallback(_: PingUpdate["payload"]) {
        timeSinceLastPing = 0;
    }

    networker.addHandler<PositionUpdate>(peerId, "position-update", updateCallback);
    networker.addHandler<PingUpdate>(peerId, "ping", pingCallback);

    let pingUpdateInterval = setInterval(() => {
        timeSinceLastPing += 1 / 60;
        if (timeSinceLastPing > maxTimeSinceLastPing) {
            networker.disconnectFrom(peerId);
        }
    }, 1000 / 60);

    let remoteMediaStream: MediaStream | undefined;

    let checkRemoteStream = setInterval(() => {
        if (!remoteMediaStream) {
            remoteMediaStream = networker.useRemoteMedia(peerId);

            if (remoteMediaStream) {
                console.log("found remote media", remoteMediaStream);
            }
        }

        if (remoteMediaStream) { 
            clearInterval(checkRemoteStream); 
        }
    }, 1000);

    onDestroy(() => {
        networker.removeHandler<PositionUpdate>(peerId, "position-update", updateCallback);
        networker.removeHandler<PingUpdate>(peerId, "ping", pingCallback);
        clearInterval(pingUpdateInterval);
        clearInterval(checkRemoteStream);
    });

    let group: Group;
    position.subscribe(position => {
        if (group)
            group.position.set(position.x, position.y, position.z);
    });

    function normalized({ x, y, z, w }: rapier3d.Quaternion) {
        let m = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w);
        return {
            x: x * m,
            y: y * m,
            z: z * m,
            w: w * m
        };
    }
    rotation.subscribe(rotation => {
        if (group) {
            let { x, y, z, w } = normalized(rotation);
            group.quaternion.set(x, y, z, w);
        }
    });
</script>

<!-- TODO -->

<Group bind:ref={group}>
    {#if remoteMediaStream}
        <PositionalAudio src={remoteMediaStream}/>
    {/if}
    
    
    <Mesh>
        <BoxGeometry args={[0.5, 0.5, 0.5]}/>
        <MeshStandardMaterial/>
    </Mesh>
</Group>