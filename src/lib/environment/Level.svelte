<script>
    import { T } from "@threlte/core";
    import { World } from "@threlte/rapier";
    import Ground from "$lib/environment/Ground.svelte";
    import Desmos from "$lib/interactives/Desmos.svelte";

</script>

<World>
    
    <T.Group position.y={5.0} position.z={10.0}>
        <Desmos/>
    </T.Group>
    

    <Ground />

    <T.DirectionalLight args={["white"]} position={[0, 1, 1]}/>
    <T.PointLight args={["white"]} />
    <T.HemisphereLight args={["white", 0.2]}/>

    <slot></slot>
</World>