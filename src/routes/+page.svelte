<script>
    import { Canvas } from '@threlte/core'
    import Scene from '$lib/Scene.svelte';

    let enabled = false;
</script>

<div>
    
    {#if enabled}
        <Canvas>
            <Scene/>
        </Canvas>
    {:else}
        <div id="begin-container">
            <button id="begin" on:click={() => enabled=true}>Initialize Room</button>
        </div>
    {/if}
</div>

<style>
    :root(body) {
        overflow: hidden;
        padding: 0;
        margin: 0;
    }

    div {
        overflow: hidden;
        width: 100vw;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
    }

    #begin-container {
        display: grid;
    }

    #begin {
        position: fixed;
        font-family: "Hack";
        font-size: 3em;
        padding: 1em;
        place-self: center;
    }
</style>