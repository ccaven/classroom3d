
<script lang="ts">
    import { spring } from "svelte/motion";
    import type * as rapier3d from '@dimforge/rapier3d-compat';
    import type { NetworkManager } from "./Networker.svelte";
    import type { PingUpdate, PositionUpdate } from "./network-types";
    import { T } from "@threlte/core";
    import { onDestroy, onMount } from "svelte";
    import { PositionalAudio } from "@threlte/extras";
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

    let interval = setInterval(() => {
        timeSinceLastPing += 1 / 60;
        if (timeSinceLastPing > maxTimeSinceLastPing) {
            networker.disconnectFrom(peerId);
        }
    }, 1000 / 60);

    onDestroy(() => {
        networker.removeHandler<PositionUpdate>(peerId, "position-update", updateCallback);
        networker.removeHandler<PingUpdate>(peerId, "ping", pingCallback);
        clearInterval(interval);
    });

    

    let remoteMediaSourceNode = networker.useRemoteMedia(peerId);

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
    {#if remoteMediaSourceNode}
        <PositionalAudio src={remoteMediaSourceNode.mediaStream} volume={0.5} id="audio-listener"/>
    {/if}
    
    <Mesh>
        <BoxGeometry args={[0.5, 0.5, 0.5]}/>
        <MeshStandardMaterial/>
    </Mesh>
</Group>