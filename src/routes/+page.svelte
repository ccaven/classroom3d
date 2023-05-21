<script>
    import { Canvas } from '@threlte/core'


    import Scene from '$lib/Scene.svelte';
</script>

<div>
    <button id="begin-audio">Begin Audio</button>

    <Canvas>

        <Scene/>
        
    </Canvas>
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

    #begin-audio {
        position: fixed;
        background-color: transparent;
        font-family: "Hack";
        width: 200px;
        height: 50px;
    }
</style>