<script lang="ts">
    import Networker from '$lib/network/Networker.svelte';
    import { writable, type Writable } from 'svelte/store';
    import { onMount } from 'svelte';
    import OnlinePlayer from './player/OnlinePlayer.svelte';
    import Player from '$lib/player/Player.svelte';
    import Level from './environment/Level.svelte';

    let networkerElement: Networker;
    let peerList: Writable<string[]> = writable([]);

    onMount(() => {
        networkerElement.usePeerList().subscribe(peerList.set);
    });
</script>

<Networker bind:this={networkerElement}>

    <Level>

        <Player />

        {#each $peerList as peerId}
            <OnlinePlayer {peerId} />
        {/each}

    </Level>   

</Networker>
