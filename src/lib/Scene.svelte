<script lang="ts">
    import { T } from '@threlte/core';
    import { OrbitControls, interactivity } from '@threlte/extras';
    interactivity()

    import { spring,  } from 'svelte/motion';
    import Networker from './Networker.svelte';

    const { 
        Mesh, 
        BoxGeometry, 
        MeshStandardMaterial, 
        DirectionalLight, 
        HemisphereLight, 
        PerspectiveCamera,
        Group
    } = T;

    let p = spring(0);
    let s = spring(1, {
        stiffness: 0.1
    });

</script>

<Networker>
    
</Networker>

<Group on:pointerover={() => $s = 1.1} on:pointerout={() => $s=1} scale={[$s, $s, $s]}>
    <Mesh position={[$p, 0, 0]}>
        <BoxGeometry attach="geometry"/>
        <MeshStandardMaterial attach="material" color="red"/>
    </Mesh>

    <Mesh position={[1, 1, 1]} on:click={() => $p=1}>
        <BoxGeometry attach="geometry"/>
        <MeshStandardMaterial attach="material" color="green"/>
    </Mesh>

    <Mesh position={[1, -1, 1]} on:click={() => $p=0}>
        <BoxGeometry attach="geometry"/>
        <MeshStandardMaterial attach="material" color="blue"/>
    </Mesh>
</Group>

<DirectionalLight position={[3, 5, 10]} />
<HemisphereLight intensity={0.2} />

<PerspectiveCamera makeDefault position={[0, 0, -5]}>

    <OrbitControls interactive/>

</PerspectiveCamera>

<Group position={[0, 0, 0]}></Group>