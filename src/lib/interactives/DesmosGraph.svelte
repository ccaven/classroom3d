
<script lang="ts">

    import * as THREE from 'three';
    import { HTML } from "@threlte/extras";
    import { onDestroy, onMount } from 'svelte';

    import Desmos, { type ExpressionState } from 'desmos';
    import type { Update } from "$lib/network/network-types";
    import { uid, useInteractiveManager } from "$lib/helper";
    import { useNetworker } from "$lib/network";
    import { T } from "@threlte/core";
    import { MeshStandardMaterial, PlaneGeometry, Vector3 } from "three";
    
    type WithId<T extends string> = `${T}-${number}`;

    type DesmosUpdateKey = "desmos-add-state" | "desmos-remove-state";
    
    type DesmosUpdate = Update<WithId<DesmosUpdateKey>, Desmos.ExpressionState>;
    
    let clientTag = new Array(8).fill(0).map((e, i) => Math.random() * 10 | 0).join("") + "___";

    let divEle: HTMLDivElement;

    const graphId = uid();
    const withId = <T extends DesmosUpdateKey>(s: T): WithId<T> => `${s}-${graphId}`;
    
    const networker = useNetworker();

    let calculator: Desmos.Calculator;

    let lastExpressions: Desmos.ExpressionState[] = [];

    function onAddState(expression: ExpressionState) {
        // If this is our expression coming back in,
        // then it must have our prefix attached to it's
        // id. If that is the case, then remove the prefix
        // because our local copy of our own expressions
        // do not contain the prefix.
        expression.id = removePrefix(expression.id, clientTag);

        calculator.setExpression(expression);

        resetLastExpressions();
    }

    function onRemoveState(expression: ExpressionState) {
        // If this is our expression coming back in,
        // then it must have our prefix attached to it's
        // id. If that is the case, then remove the prefix
        // because our local copy of our own expressions
        // do not contain the prefix.
        expression.id = removePrefix(expression.id, clientTag);

        calculator.removeExpression({ id: expression.id || "" });

        resetLastExpressions();
    }

    onMount(() => {

        // Initialize the calculator
        // TODO: Be more precise with what is allowed/not allowed
        calculator = Desmos.GraphingCalculator(divEle, {
            autosize: false,
            images: false,
            folders: false,
            projectorMode: true,
            notes: true     
        });

        resetLastExpressions();
        
        // This is the polling interval
        // that checks for updates in the state
        // of the local graph.
        setInterval(() => {

            /**
             * Compute a new expression check
             */
            let newExpressions = calculator.getExpressions();

            /**
             * Computed expressions that appeared in the new check
             * but were not in the old check.
             */
            let addedExpressions = newExpressions.filter(u => {
                return !lastExpressions.find(v => objectEquals(v, u));
            });

            /**
             * Computed expressions that do not appear in the new check
             * but did appear in the old check.
             */
            let removedExpressions = lastExpressions.filter(u => {
                return !newExpressions.find(v => objectEquals(v, u)) && !addedExpressions.find(v => v.id == u.id);
            });

            // Send a DesmosUpdate for each added expression
            // NOTE: There SHOULD only be one added expression,
            //       but some cases, such as adding a bunch of
            //       sliders at once, multiple DesmosUpdate's
            //       will be sent.
            addedExpressions.forEach(expression => {

                // If this is one of our expressions,
                // meaning it does not contain a prefix
                // then add our prefix before sending it out
                expression.id = addPrefix(expression.id, clientTag);

                networker.broadcast<DesmosUpdate>(
                    withId("desmos-add-state"), 
                    expression
                );
            });

            // Send a DesmosUpdate for each removed expression
            // NOTE: There SHOULD only be one removed expression
            //       but some cases, such as deleting a bunch
            //       of blank lines at once, multiple
            //       DesmosUpdate's are sent.
            removedExpressions.forEach(expression => {

                // If this is one of our expressions,
                // meaning it does not contain a prefix
                // then add our prefix before sending it out
                expression.id = addPrefix(expression.id, clientTag);

                networker.broadcast<DesmosUpdate>(
                    withId("desmos-remove-state"), 
                    expression
                );
            });

            // Update the expression cache
            // so differences are not counted twice
            resetLastExpressions();
        }, 100);
    });

    // Add the handlers to the networker
    networker.addGlobalHandler<DesmosUpdate>(withId("desmos-add-state"), onAddState);
    networker.addGlobalHandler<DesmosUpdate>(withId("desmos-remove-state"), onRemoveState);

    // If the component is for some reason
    // removed from the tree, remove its event handlers
    onDestroy(() => {
        networker.removeGlobalHandler<DesmosUpdate>(withId("desmos-add-state"), onAddState);
        networker.removeGlobalHandler<DesmosUpdate>(withId("desmos-remove-state"), onRemoveState);
    });

    /**
     * Create a cache to avoid computing the output for two identical inputs
     * @param f The function to memoize
     */
    function memoize<T, K>(f: (a: T) => K) {
        let mem = new Map<T, K>();
        return (a: T) => {
            if (mem.has(a)) return mem.get(a);
            let value = f(a);
            mem.set(a, value);
            return value;
        };
    }

    /**
     * A memoized version of JSON.stringify
     */
    const stringify = memoize(JSON.stringify);

    /**
     * Use JSON.stringify to determine if two objects are equal
     * @param a - The first object
     * @param b - The second object
     */
    function objectEquals(a: any, b: any) {
        return stringify(a) == stringify(b);
    }

    /**
     * Set the `lastExpressions` variable to the latest
     * expressions in the calculator.
     */
    function resetLastExpressions() {
        lastExpressions = calculator.getExpressions();
    }

    /**
     * Remove a prefix if it exists, otherwise do nothing
     * @param full - The full string
     * @param prefix - The prefix to remove
     * @returns The full string without the prefix
     */
    function removePrefix(full: string | undefined, prefix: string) {
        return full?.startsWith(prefix) ? full.replace(prefix, "") : full;
    }

    /**
     * Add a prefix if no prefix exists, otherwise do nothing
     * @param full - The full string
     * @param prefix - The prefix to remove
     * @returns The full string with the prefix added
     */
    function addPrefix(full: string | undefined, prefix: string) {
        return full?.indexOf("___") == -1 ? prefix + full : full;
    }

    let thisObject: THREE.Group;

    let interactiveManager = useInteractiveManager();
    
    interactiveManager.getPosition = () => {
        let pos = new THREE.Vector3();
        thisObject.getWorldPosition(pos);

        let dir = new THREE.Vector3();
        thisObject.getWorldDirection(dir);
        return pos.addScaledVector(dir, 2.5);
    };

    interactiveManager.getTarget = () => {
        let pos = new THREE.Vector3();
        thisObject.getWorldPosition(pos);
        return pos;
    };

</script>

<T.Group>
    <T.Mesh position.z={-0.01}>
        <T.PlaneGeometry args={[2.55, 2.55]}/>
        <T.MeshStandardMaterial/>
    </T.Mesh>
    
    <HTML transform occlude {...$$props} bind:ref={thisObject}>
        <div 
            bind:this={divEle} 
            style:width="1000px" 
            style:height="1000px" 
        />
    </HTML>
</T.Group>

