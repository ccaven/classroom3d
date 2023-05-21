<script lang="ts">

    import { T } from "@threlte/core";
    import { AutoColliders } from "@threlte/rapier";

    const {
        Group,
        Mesh,
        BoxGeometry,
        MeshStandardMaterial
    } = T;

</script>

<Group position.y={-1}>
    <AutoColliders shape="cuboid">
        <Mesh receiveShadow>
            <BoxGeometry args={[5, 0.5, 5]}/>
            <MeshStandardMaterial color="blue"/>
        </Mesh>
    </AutoColliders>
</Group>

