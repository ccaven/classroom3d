<!-- 
    
    TODO: Fix ID clash problem

    Maybe prefix IDs with peerId?

-->

<script lang="ts">

    import { HTML } from "@threlte/extras";
    import { onDestroy, onMount } from 'svelte';

    import Desmos, { type ExpressionState, type GraphSettings } from 'desmos';
    import type { Update } from "$lib/network/network-types";
    import { uid } from "$lib/helper/uid";
    import { useNetworker } from "$lib/network";
    
    type WithId<T extends string> = `${T}-${number}`;

    type DesmosUpdateKey = "desmos-add-state" | "desmos-remove-state";
    
    type DesmosUpdate = Update<WithId<DesmosUpdateKey>, Desmos.ExpressionState>;
    
    let clientTag = new Array(8).fill(0).map((e, i) => Math.random() * 10 | 0).join("");

    let divEle: HTMLDivElement;

    const id = uid();
    const withId = <T extends DesmosUpdateKey>(s: T): WithId<T> => `${s}-${id}`;
    
    const networker = useNetworker();

    let calculator: Desmos.Calculator;

    let lastExpressions: Desmos.ExpressionState[] = [];

    function onAddState(expression: ExpressionState) {
        if (expression.id?.startsWith(clientTag)) {
            expression.id = expression.id.replace(clientTag + "___", "");
        }
        
        console.log("Added expression", expression);

        calculator.setExpression(expression);
        lastExpressions = calculator.getExpressions();
    }
    function onRemoveState(expression: ExpressionState) {
        if (expression.id?.startsWith(clientTag)) {
            expression.id = expression.id.replace(clientTag + "___", "");
        }

        console.log("Removed expression", expression);

        calculator.removeExpression({ id: expression.id || "" });
        lastExpressions = calculator.getExpressions();
    }

    onMount(() => {

        calculator = Desmos.GraphingCalculator(divEle, {
            autosize: false,
            images: false,
            folders: false,
            projectorMode: true,
            notes: true     
        });

        lastExpressions = calculator.getExpressions();

        /** TODO: Check for old/new expressions */
        
        setInterval(() => {

            if (!networker.usePeerId()) return;

            let newExpressions = calculator.getExpressions();

            // Calculate differences
            let addedExpressions = newExpressions.filter(u => {
                return !lastExpressions.find(v => objectEquals(v, u));
            });

            let removedExpressions = lastExpressions.filter(u => {
                return !newExpressions.find(v => objectEquals(v, u)) && !addedExpressions.find(v => v.id == u.id);
            });

            addedExpressions.forEach(expression => {
                console.log("Added expression", expression);

                if (expression.id?.indexOf("___") == -1) {
                    expression.id = clientTag + "___" + expression.id;
                }

                networker.broadcast<DesmosUpdate>(
                    withId("desmos-add-state"), 
                    expression
                );
            });

            removedExpressions.forEach(expression => {
                console.log("Removed expression", expression);

                if (expression.id?.indexOf("___") == -1) {
                    expression.id = clientTag + "___" + expression.id;
                }

                networker.broadcast<DesmosUpdate>(withId("desmos-remove-state"), expression);
            });

            lastExpressions = calculator.getExpressions();
        }, 100);
    });

    networker.addGlobalHandler<DesmosUpdate>(withId("desmos-add-state"), onAddState);
    networker.addGlobalHandler<DesmosUpdate>(withId("desmos-remove-state"), onRemoveState);

    onDestroy(() => {
        networker.removeGlobalHandler<DesmosUpdate>(withId("desmos-add-state"), onAddState);
        networker.removeGlobalHandler<DesmosUpdate>(withId("desmos-remove-state"), onRemoveState);
    });

    function memoize<T, K>(f: (a: T) => K) {
        let mem = new Map<T, K>();
        return (a: T) => {
            if (mem.has(a)) return mem.get(a);
            let value = f(a);
            mem.set(a, value);
            return value;
        };
    }

    const stringify = memoize(JSON.stringify);

    function objectEquals(a: any, b: any) {
        return stringify(a) == stringify(b);
    }

</script>


<HTML transform occlude {...$$props}>
    <div 
        bind:this={divEle} 
        style:width="1000px" 
        style:height="1000px" 
    />
</HTML>
