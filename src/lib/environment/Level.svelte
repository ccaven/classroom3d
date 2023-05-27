<script>
    import { T } from "@threlte/core";
    import { World } from "@threlte/rapier";
    import Ground from "$lib/environment/Ground.svelte";
    import DesmosGraph from "$lib/interactives/DesmosGraph.svelte";

</script>

<World>
    
    <T.Group position.y={1.0} position.z={-6.95}>
        <DesmosGraph scale.x=0.1 scale.y=0.1 />
    </T.Group>
    
    <Ground />

    <T.DirectionalLight args={["white"]} position={[0, 1, 1]}/>
    <T.PointLight args={["white"]} />
    <T.HemisphereLight args={["white", 0.2]}/>

    <slot></slot>
</World>