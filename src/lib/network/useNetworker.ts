import { getContext } from "svelte";
import type { NetworkManager } from "./Networker.svelte";
import type { Writable } from "svelte/store";

export function useNetworker() {
    
    return getContext("networker") as NetworkManager;

}
