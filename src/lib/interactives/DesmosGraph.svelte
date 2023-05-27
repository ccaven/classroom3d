<script lang="ts">

    import { HTML } from "@threlte/extras";
    import { onMount } from 'svelte';

    import Desmos from 'desmos';
    import type { Update } from "$lib/network/network-types";
    import { uid } from "$lib/helper/uid";
    import { useNetworker } from "$lib/network";

    let divEle: HTMLDivElement;

    type AddExpressionUpdate = Update<`desmos-graph-add-expression-${number}`, Desmos.ExpressionState>;
    type RemoveExpressionUpdate = Update<`desmos-graph-remove-expression-${number}`, Desmos.ExpressionState>;

    const id = uid();
    const networker = useNetworker();

    let calculator: Desmos.Calculator | undefined;
    
    networker.addGlobalHandler<AddExpressionUpdate>(`desmos-graph-add-expression-${id}`, expressionState => {
        calculator?.setExpression(expressionState);
    });

    networker.addGlobalHandler<RemoveExpressionUpdate>(`desmos-graph-remove-expression-${id}`, expressionState => {
        calculator?.removeExpression({ id: expressionState.id || "" });
    });
    
    let pastExpressions: Desmos.ExpressionState[] = [];

    onMount(() => {

        calculator = Desmos.GraphingCalculator(divEle, {
            autosize: false
        });

        calculator.setExpression({ id: "m", latex: "m=2" });

        calculator.observeEvent("change", () => {

            const expressions = calculator?.getExpressions();

            if (expressions == undefined) return;

            const addedExpressions = expressions
                .filter(u => !pastExpressions.find(v => v.id == u.id) );

            const removedExpressions = pastExpressions
                .filter(u => !expressions?.find(v => v.id == u.id));

            addedExpressions.forEach(expression => {
                networker.broadcast<AddExpressionUpdate>(`desmos-graph-add-expression-${id}`, expression);
            });

            removedExpressions.forEach(expression => {
                networker.broadcast<RemoveExpressionUpdate>(`desmos-graph-remove-expression-${id}`, expression);
            });

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
