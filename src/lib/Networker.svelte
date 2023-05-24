<script lang="ts" context="module">
    import type { Writable } from 'svelte/store';
    import type { DataConnection, MediaConnection } from 'peerjs';
    import type { AnyUpdate, UserListUpdate, PingUpdate } from './network-types';
    
    export type NetworkEvent<Key extends string, Payload> = {
        key: Key,
        payload: Payload
    };

    type Message = {
        key: string,
        payload: any,
        from: string
    };

    interface Handler<T> {
        (payload: T): void;
    }

    type HandlerList =  Array<Handler<any>>;
    type HandlerMap = Map<string, HandlerList>;
    type Handlers = Map<string, HandlerMap>;
    type GlobalHandlers = HandlerMap;

    type Payload<U extends AnyUpdate> = U["payload"];
    type Key<U extends AnyUpdate> = U["key"];
    
    export interface NetworkManager {

        addHandler<U extends AnyUpdate>(peerId: string, key: Key<U>, handler: Handler<Payload<U>>): void;
        removeHandler<U extends AnyUpdate>(peerId: string, key: Key<U>, handler: Handler<Payload<U>>): void;
        addGlobalHandler<U extends AnyUpdate>(key: Key<U>, handler: Handler<Payload<U>>): void;
        removeGlobalHandler<U extends AnyUpdate>(key: Key<U>, handler: Handler<Payload<U>>): void;
        disconnectFrom(peerId: string): void;
        addDataConnection(peerId: string, connection: DataConnection): void;
        call(peerId: string): Promise<void>;
        addMediaConnection(peerId: string, connection: MediaConnection): void;
        connectTo(peerId: string): void;
        broadcast<U extends AnyUpdate>(key: Key<U>, payload: Payload<U>): void;
        useLocalMedia(): {
            source: MediaStreamAudioSourceNode | undefined,
            destination: MediaStreamAudioDestinationNode | undefined
        },
        useRemoteMedia(peerId: string): MediaStream | undefined
    }

</script>

<script lang="ts">
    /**
     * TODO
     * 
     * Fix disconnections
     * 
     * Create hook: "useNetworkEvent"
     * Create hook: "useRemoteSourceNode"
     * Create hook: "useClient"
     * 
     * setContext("classroom3d-networker", networker)
     * 
    */

    import Peer from 'peerjs';
    import { writable } from 'svelte/store';
    import { setupReverb } from './audio/reverb';

    const client: Peer = new Peer();

    const dataConnections = new Map<string, DataConnection>();
    const mediaConnections = new Map<string, MediaConnection>();
    const remoteMediaStream = new Map<string, MediaStream>();
    const remoteAudioElements = new Map<string, HTMLAudioElement>();

    const handlers: Handlers = new Map();
    const globalHandlers: GlobalHandlers = new Map();

    const audioContext = new AudioContext({
        sampleRate: 16_000
    });

    let audioElement: HTMLAudioElement;
    
    /*
    {
        let oscillator = new OscillatorNode(audioContext, { frequency: 200 });

        let gain = new GainNode(audioContext, { gain: 0.1 });

        oscillator.connect(gain);

        gain.connect(audioContext.destination);

        oscillator.start();
    }
    */
    
    /** The media stream that is sent across channels */
    let localMediaSourceNode: MediaStreamAudioSourceNode | undefined;
    let localMediaDestinationNode: MediaStreamAudioDestinationNode | undefined;
    const userMediaPromise = (async () => {
        const localStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
        });

        localMediaSourceNode = audioContext.createMediaStreamSource(localStream);

        localMediaDestinationNode = audioContext.createMediaStreamDestination();

        let gainNode = audioContext.createGain();

        gainNode.gain.value = 0.1;

        await audioContext.audioWorklet.addModule("/src/lib/audio/voice-worklet.js");
        let processorNode = new AudioWorkletNode(audioContext, "voice-worklet");

        /*
        setupReverb(audioContext, processorNode, gainNode, {
            reverbTime: 0.1
        });
        */
        
        localMediaSourceNode.connect(processorNode);
        processorNode.connect(gainNode);
        gainNode.connect(localMediaDestinationNode);

        return localMediaDestinationNode.stream;
    })();

    const peerList = writable<string[]>([]);
    
    const networker: NetworkManager = {
        addHandler(peerId, key, handler) {
            if (!handlers.has(peerId)) handlers.set(peerId, new Map());
            if (!handlers.get(peerId)?.has(key)) handlers.get(peerId)?.set(key, []);
            handlers.get(peerId)?.get(key)?.push(handler);
        },

        removeHandler(peerId, key, handler) {
            if (!handlers.has(peerId)) handlers.set(peerId, new Map());
            if (!handlers.get(peerId)?.has(key)) handlers.get(peerId)?.set(key, []);

            let index = handlers.get(peerId)?.get(key)?.indexOf(handler) as number;

            if (index > -1) handlers.get(peerId)?.get(key)?.splice(index, 1);
        },

        addGlobalHandler(key, handler) {
            if (!globalHandlers.has(key)) globalHandlers.set(key, []);
            globalHandlers.get(key)?.push(handler);
        },

        removeGlobalHandler(key, handler) {
            if (!globalHandlers.has(key)) globalHandlers.set(key, []);

            let index = globalHandlers.get(key)?.indexOf(handler) as number;
            globalHandlers.get(key)?.splice(index, 1);
        },

        disconnectFrom(peerId) {
            console.log("Disconnecting from", peerId);

            dataConnections.get(peerId)?.close();
            mediaConnections.get(peerId)?.close();

            dataConnections.delete(peerId);
            mediaConnections.delete(peerId);
            remoteAudioElements.delete(peerId);

            peerList.update(currentPeerList => currentPeerList.filter(id => id != peerId));
        },

        addDataConnection(peerId, connection) {
            if (dataConnections.has(peerId)) return;

            dataConnections.set(peerId, connection);

            // System for who calls who
            if (peerId.localeCompare(client.id) > 0) this.call(peerId);

            dataConnections.get(peerId)?.on("data", data => {
                let message = data as Message;
                if (message.key == "user-list") console.log(message);
                handlers.get(peerId)?.get(message.key)?.forEach(handler => {
                    handler(message.payload);
                });
                globalHandlers.get(message.key)?.forEach(handler => handler(message.payload));
            });

            dataConnections.get(peerId)?.on("close", () => {
                this.disconnectFrom(peerId);
            });

            peerList.update(currentPeerList => [...currentPeerList, peerId]);
        },

        /** Helper function to make addDataConnection synchronous */
        async call(peerId) {
            console.log("calling", peerId)
            const localStream = await userMediaPromise;
            const mediaConnection = client.call(peerId, localStream);
            this.addMediaConnection(peerId, mediaConnection);
        },

        addMediaConnection(peerId, connection) {

            mediaConnections.set(peerId, connection);

            let sourceNode: MediaStreamAudioSourceNode;

            function addStream(remoteStream: MediaStream) {
                
                audioContext.resume();
                //console.log(remoteMediaSourceNode);
                //console.log(audioContext.destination);

                let audio = new Audio();
                audio.srcObject = remoteStream;
                audio.muted = true;
                remoteAudioElements.set(peerId, audio);

                const remoteMediaSourceNode = audioContext.createMediaStreamSource(remoteStream);
                const remoteMediaDestinationNode = audioContext.createMediaStreamDestination();

                setupReverb(audioContext, remoteMediaSourceNode, remoteMediaDestinationNode, {
                    reverbTime: 1.0
                });

                remoteMediaStream.set(peerId, remoteMediaDestinationNode.stream);
            }

            if (connection.remoteStream) {
                console.log("has remote stream")
                addStream(connection.remoteStream);
            } else {
                connection.on("stream", remoteStream => {
                    console.log("onStream fired")
                    addStream(remoteStream);
                });
            }            

            connection.on("close", () => {
                this.disconnectFrom(peerId);
                sourceNode?.disconnect();
            });
        },

        connectTo(peerId) {
            if (!client.id) return;
            if (peerId == client.id) return;
            if (dataConnections.has(peerId)) return;

            const connection = client.connect(peerId);
            connection.on("open", () => {
                this.addDataConnection(peerId, connection);
            });
        },

        broadcast(key, payload) {
            if (!client.id) return;

            dataConnections.forEach(connection => {
                connection.send({
                    key, payload, from: client.id
                } as Message);
            });
        },

        useLocalMedia() {
            return {
                source: localMediaSourceNode,
                destination: localMediaDestinationNode,
            }
        },

        useRemoteMedia(peerId) {
            return remoteMediaStream.get(peerId);
        }
    };

    /** Either initialize as "Learner" or "Tutor" */
    const urlSearchParams = new URLSearchParams(location.search);
    const isLearner = urlSearchParams.has("join-id");
    client.on("open", _ => {
        if (isLearner) {
            networker.connectTo(urlSearchParams.get("join-id") as string);
        } else {
            // This happens ONLY for the tutor
            // Other learners will not take action upon
            // a new connection
            client.on("connection", connection => {
                networker.addDataConnection(connection.peer, connection);

                if (connection.open) {
                    connection.send({
                        key: "user-list",
                        from: client.id,
                        payload: [...dataConnections.keys()]
                    } as Message);
                } else {
                    connection.on("open", () => {
                        console.log([...dataConnections.keys()]);
                        connection.send({
                            key: "user-list",
                            from: client.id,
                            payload: [...dataConnections.keys()]
                        } as Message);
                    });
                }
            });
        }

        console.log(`localhost:5173/?join-id=${client.id}`);
    });

    /** Logic for receiving calls */
    client.on("call", async connection => {
        const peerId = connection.peer;
        connection.answer(await userMediaPromise);
        networker.addMediaConnection(peerId, connection);
    });

    client.on("connection", connection => {
        networker.addDataConnection(connection.peer, connection);
    });

    /** When we get a new user-list, try to connect to each user */
    networker.addGlobalHandler<UserListUpdate>("user-list", userList => {
        console.log(userList);
        userList.forEach(peerId => networker.connectTo(peerId));
    });

    export function usePeerList() {
        return peerList;
    }

    setInterval(() => {
        networker.broadcast<PingUpdate>("ping", null);
    }, 1_000);

</script>

<!-- 
    Currently, uses the slot prop to pass down networker
    Consider creating a hook to access the networker object?

    For example,

    ```js
    let { networker } = useNetworker();
    ```
-->

<audio bind:this={audioElement} muted={true}></audio>

<slot {networker}/>