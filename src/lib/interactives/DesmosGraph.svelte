<script lang="ts">

    import { HTML } from "@threlte/extras";
    import { onMount } from 'svelte';

    import Desmos from 'desmos';
    import type { Update } from "$lib/network/network-types";
    import { uid } from "$lib/helper/uid";
    import { useNetworker } from "$lib/network";

    let divEle: HTMLDivElement;

    type ExpressionStateUpdate = Update<`desmos-graph-new-state-${number}`, Desmos.ExpressionState[]>;
    const id = uid();
    const networker = useNetworker();

    let calculator: Desmos.Calculator | undefined;
    
    networker.addGlobalHandler<ExpressionStateUpdate>(`desmos-graph-new-state-${id}`, expressions => {
        calculator?.setExpressions(expressions)
    });

    
    let pastExpressions: Desmos.ExpressionState[] = [];

    onMount(() => {

        calculator = Desmos.GraphingCalculator(divEle, {
            autosize: false
        });

        calculator.setExpression({ id: "m", latex: "m=2" });

        calculator.observeEvent("change", () => {

            const expressions = calculator?.getExpressions();

            if (!expressions) return;

            networker.broadcast<ExpressionStateUpdate>(`desmos-graph-new-state-${id}`, expressions);

        });


    });


</script>


<HTML transform occlude {...$$props}>
    <div 
        bind:this={divEle} 
        style:width="1000px" 
        style:height="1000px" 
    />
</HTML>
