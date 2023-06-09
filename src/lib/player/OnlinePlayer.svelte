
<script lang="ts">
    import { spring } from "svelte/motion";
    import type { PingUpdate, PositionUpdate } from "$lib/network";
    import { T } from "@threlte/core";
    import { onDestroy } from "svelte";
    import { PositionalAudio } from "@threlte/extras";
    import PlayerMesh from "./PlayerMesh.svelte";
    import { normalized, useNetworker } from "$lib/helper";

    // export let networker: NetworkManager;
    export let peerId: string;
    let thisObject: THREE.Group;

    const networker = useNetworker();

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
        }

        if (remoteMediaStream) { 
            clearInterval(checkRemoteStream); 
        }
    }, 1000);

    networker.addHandler<PositionUpdate>(peerId, "position-update", updateCallback);
    networker.addHandler<PingUpdate>(peerId, "ping", pingCallback);

    onDestroy(() => {
        networker.removeHandler<PositionUpdate>(peerId, "position-update", updateCallback);
        networker.removeHandler<PingUpdate>(peerId, "ping", pingCallback);
        clearInterval(pingUpdateInterval);
        clearInterval(checkRemoteStream);
    });    

    position.subscribe(position => {
        if (thisObject)
            thisObject.position.set(position.x, position.y, position.z);
    });

    rotation.subscribe(rotation => {
        if (thisObject) {
            let { x, y, z, w } = normalized(rotation);
            thisObject.quaternion.set(x, y, z, w);
        }
    });
</script>

<!-- TODO -->

<T.Group bind:ref={thisObject}>
    {#if remoteMediaStream}
        <PositionalAudio src={remoteMediaStream} refDistance={5}/>
    {/if}
    
    <PlayerMesh visible={true} />
</T.Group>