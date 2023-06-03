<script lang="ts">
    import Networker from '$lib/network';
    import { writable, type Writable } from 'svelte/store';
    import { onMount } from 'svelte';
    import OnlinePlayer from './player/OnlinePlayer.svelte';
    import Player from '$lib/player/Player.svelte';
    import Level from './environment/Level.svelte';
    import { setContext } from 'svelte';
    import { setPlayerWritable } from './helper/hooks';

    let networkerElement: Networker;
    let peerList: Writable<string[]> = writable([]);

    export let player: Writable<Player> = writable();
    
    setPlayerWritable(player);

    onMount(() => {
        networkerElement.usePeerList().subscribe(peerList.set);
    });
</script>

<Networker bind:this={networkerElement}>

    <Level>

        <Player bind:this={$player}/>

        {#each $peerList as peerId}
            <OnlinePlayer {peerId} />
        {/each}

    </Level>   

</Networker>
