<script lang="ts">
    import * as THREE from 'three';

    import { T, useThrelte } from '@threlte/core';
    import { AudioListener, OrbitControls, interactivity, useAudioListener } from '@threlte/extras';
    import { AutoColliders, World } from '@threlte/rapier';

    import Networker from './Networker.svelte';
    import { writable, type Writable } from 'svelte/store';
    import { onMount } from 'svelte';
    import OnlinePlayer from './OnlinePlayer.svelte';
    import Player from './Player.svelte';
    import Ground from './Ground.svelte';

    const { 
        Mesh, 
        BoxGeometry, 
        MeshStandardMaterial, 
        DirectionalLight, 
        HemisphereLight, 
        PerspectiveCamera,
        Group
    } = T;

    const { renderer } = useThrelte();

    let networkerElement: Networker;
    let peerList: Writable<string[]> = writable([]);

    onMount(() => {
        networkerElement.usePeerList().subscribe(peerList.set);
    });
</script>

<Networker bind:this={networkerElement} let:networker>
    <World>
        <Ground />
        <Player {networker}/>
    </World>

    <AudioListener/>

    {#each $peerList as peerId}
        <OnlinePlayer {peerId} {networker} />
    {/each}
    
    <T.PerspectiveCamera let:ref makeDefault position={[0, 0, -5]}>
        <OrbitControls args={[ref, renderer?.domElement]}/>
    </T.PerspectiveCamera>

    <T.DirectionalLight args={["white"]} position={[0, 1, 1]}/>

    <T.HemisphereLight args={["white", 0.2]}/>
</Networker>
