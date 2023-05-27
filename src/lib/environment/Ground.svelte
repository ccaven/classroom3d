<script lang="ts">

    import { T } from "@threlte/core";
    import { AutoColliders, Collider, CollisionGroups } from "@threlte/rapier";

    const {
        Group,
        Mesh,
        BoxGeometry,
        MeshStandardMaterial
    } = T;

</script>

<Group position.y={-1}>
    <CollisionGroups groups={[0, 15]}>

        <AutoColliders shape="cuboid" friction={1.0}>
            <Mesh receiveShadow>
                <BoxGeometry args={[15, 0.5, 15]}/>
                <MeshStandardMaterial color="blue"/>
            </Mesh>
    
            <Mesh receiveShadow position.z={-7.5}>
                <BoxGeometry args={[15, 5, 1]}/>
                <MeshStandardMaterial color="lightgreen"/>
            </Mesh>
    
            <Mesh receiveShadow position.z={7.5}>
                <BoxGeometry args={[15, 5, 1]}/>
                <MeshStandardMaterial color="violet"/>
            </Mesh>
    
            <Mesh receiveShadow position.x={7.5}>
                <BoxGeometry args={[1, 5, 15]}/>
                <MeshStandardMaterial color="lightpink"/>
            </Mesh>
    
            <Mesh receiveShadow position.x={-7.5}>
                <BoxGeometry args={[1, 5, 15]}/>
                <MeshStandardMaterial color="coral"/>
            </Mesh>
        </AutoColliders>

    </CollisionGroups>
    
</Group>

