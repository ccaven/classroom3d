<script lang="ts">
    import { T } from "@threlte/core";
    import * as THREE from 'three';

    export let visible: boolean;
</script>

<T.Mesh 
    receiveShadow
    castShadow,
    geometry={ new THREE.CapsuleGeometry(0.3, 0.75) }
    material={ new THREE.MeshStandardMaterial() }
/>