<!-- 
    TODO: Fix sync problems across multiple users sharing a graph 

    IDEA: Use tutor user as relay instead of sending updates to everyone
    OR find better way to track diff
-->

<script lang="ts">

    import { HTML } from "@threlte/extras";
    import { onDestroy, onMount } from 'svelte';

    import Desmos from 'desmos';
    import type { Update } from "$lib/network/network-types";
    import { uid } from "$lib/helper/uid";
    import { useNetworker } from "$lib/network";
    
    type ExpressionStateUpdate = Update<`desmos-graph-new-state-${number}`, Desmos.ExpressionState[]>;
    
    let divEle: HTMLDivElement;

    const id = uid();
    const networker = useNetworker();

    let calculator: Desmos.Calculator;
    
    function onExpressionStateUpdate(expressions: ExpressionStateUpdate["payload"]) {        
        calculator.setBlank();
        calculator.setExpressions(expressions);
    }

    onMount(() => {

        calculator = Desmos.GraphingCalculator(divEle, {
            autosize: false
        });

        /** TODO: Check for old/new expressions */

        /*
        let lastExpressions: Desmos.ExpressionState[] = [];
        setInterval(() => {
            let newExpressions = calculator.getExpressions();

            

        }, 1000);
        */

    });

    // Register handlers with networker
    networker.addGlobalHandler<ExpressionStateUpdate>(`desmos-graph-new-state-${id}`, onExpressionStateUpdate);

    onDestroy(() => {
        networker.removeGlobalHandler<ExpressionStateUpdate>(`desmos-graph-new-state-${id}`, onExpressionStateUpdate);
    });

</script>


<HTML transform occlude {...$$props}>
    <div 
        bind:this={divEle} 
        style:width="1000px" 
        style:height="1000px" 
    />
</HTML>
