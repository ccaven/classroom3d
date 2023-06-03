import * as THREE from 'three';
import type { NetworkManager } from "$lib/network/Networker.svelte";
import type Player from "$lib/player/Player.svelte";
import { getContext, setContext } from "svelte";
import type { Writable } from "svelte/store";

export const setPlayerWritable = (player: Writable<Player>) => setContext("player-writable-context", player);
export const usePlayerWritable = () => getContext("player-writable-context") as Writable<Player>;

export const setNetworker = (networker: NetworkManager) => setContext("networker", networker);
export const useNetworker = () => getContext("networker") as NetworkManager;

export const setInteractiveManager = () => setContext("interactive-manager", {
    getPosition: () => new THREE.Vector3(),
    getTarget: () => new THREE.Vector3()
});
export const useInteractiveManager = () => getContext("interactive-manager") as {
    getPosition: () => THREE.Vector3,
    getTarget: () => THREE.Vector3
};