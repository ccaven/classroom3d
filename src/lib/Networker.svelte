<script lang="ts">

    /**
     * TODO
     * 
     * Test multi-user connections and disconnections
     * 
     * Create hook: "useNetworkEvent"
     * Create hook: "useRemoteSourceNode"
     * Create hook: "useClient"
     * 
     * setContext("classroom3d-networker", networker)
     * 
    */

    import Peer from 'peerjs';
    import type { DataConnection, MediaConnection } from 'peerjs';

    type Message = {
        key: string,
        payload: any,
        from: string
    };

    type Handler<T> = (payload: T) => void;
    
    type Handlers = Map<string, Map<string, Handler<any>[]>>;
    type GlobalHandlers = Map<string, Handler<any>[]>;

    const client: Peer = new Peer();

    const dataConnections = new Map<string, DataConnection>();
    const mediaConnections = new Map<string, MediaConnection>();
    const mediaSourceNodes = new Map<string, MediaStreamAudioSourceNode>();

    const handlers: Handlers = new Map();
    const globalHandlers: GlobalHandlers = new Map();

    const audioContext = new AudioContext({
        latencyHint: "interactive",
        sampleRate: 16_000
    });
    
    /** The media stream that is sent across channels */
    const userMediaPromise = (async () => {
        const localStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
        });

        const userSourceNode = new MediaStreamAudioSourceNode(audioContext, {
            mediaStream: localStream
        });

        const destinationNode = new MediaStreamAudioDestinationNode(audioContext);

        // here is where any preprocessing goes
        // for example, muting/unmuting
        // can this be made accessible to 
        // other files?

        // audio logic doesn't need to be in Networker.svelte

        userSourceNode.connect(destinationNode);

        return destinationNode.stream;
    })();

    const networker = {
        addHandler<Payload>(peerId: string, key: string, handler: Handler<Payload>) {
            if (!handlers.has(peerId)) handlers.set(peerId, new Map());
            if (!handlers.get(peerId)?.has(key)) handlers.get(peerId)?.set(key, []);
            handlers.get(peerId)?.get(key)?.push(handler);
        },

        removeHandler<Payload>(peerId: string, key: string, handler: Handler<Payload>) {
            if (!handlers.has(peerId)) handlers.set(peerId, new Map());
            if (!handlers.get(peerId)?.has(key)) handlers.get(peerId)?.set(key, []);

            let index = handlers.get(peerId)?.get(key)?.indexOf(handler) as number;

            if (index > -1) handlers.get(peerId)?.get(key)?.splice(index, 1);
        },

        addGlobalHandler<Payload>(key: string, handler: Handler<Payload>) {
            if (!globalHandlers.has(key)) globalHandlers.set(key, []);
            globalHandlers.get(key)?.push(handler);
        },

        removeGlobalHandler<Payload>(key: string, handler: Handler<Payload>) {
            if (!globalHandlers.has(key)) globalHandlers.set(key, []);

            let index = globalHandlers.get(key)?.indexOf(handler) as number;
            globalHandlers.get(key)?.splice(index, 1);
        },

        disconnectFrom(peerId: string) {
            dataConnections.get(peerId)?.close();
            mediaConnections.get(peerId)?.close();

            dataConnections.delete(peerId);
            mediaConnections.delete(peerId);
        },

        addDataConnection(peerId: string, connection: DataConnection) {
            dataConnections.set(peerId, connection);

            // System for who calls who
            if (peerId.localeCompare(client.id) > 0) this.call(peerId);

            dataConnections.get(peerId)?.on("data", data => {
                let message = data as Message;
                handlers.get(peerId)?.get(message.key)?.forEach(handler => {
                    handler(message.payload);
                });
                globalHandlers.get(message.key)?.forEach(handler => handler(message.payload))
            });
        },

        /** Helper function to make addDataConnection synchronous */
        async call(peerId: string) {
            const localStream = await userMediaPromise;
            const mediaConnection = client.call(peerId, localStream);
            this.addMediaConnection(peerId, mediaConnection);
        },

        addMediaConnection(peerId: string, connection: MediaConnection) {

            mediaConnections.set(peerId, connection);

            let sourceNode: MediaStreamAudioSourceNode;

            connection.on("stream", remoteStream => {
                sourceNode = audioContext.createMediaStreamSource(remoteStream);
                mediaSourceNodes.set(peerId, sourceNode);
            });

            connection.on("close", () => {
                this.disconnectFrom(peerId);
                sourceNode?.disconnect();
            });
        },

        connectTo(peerId: string) {
            if (!client.id) return;
            if (peerId == client.id) return;
            if (dataConnections.has(peerId)) return;

            const connection = client.connect(peerId);
            connection.on("open", () => {
                this.addDataConnection(peerId, connection);
            });
        },

        broadcast<P>(key: string, payload: P) {
            if (!client.id) return;

            dataConnections.forEach(connection => {
                connection.send({
                    key, payload, from: client.id
                } as Message);
            });
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
                connection.send({
                    key: "user-list",
                    from: client.id,
                    payload: [...dataConnections.keys()]
                } as Message);
            });
        }
    });

    /** Logic for receiving calls */
    client.on("call", async connection => {
        const peerId = connection.peer;
        connection.answer(await userMediaPromise);
        networker.addMediaConnection(peerId, connection);
    });    

    /** When we get a new user-list, try to connect to each user */
    networker.addGlobalHandler<string[]>("user-list", functionalMap(networker.connectTo));

    /** Creates a new function which applies the callback to every element of some array. */
    function functionalMap<T, K>(callback: (element: T, index?: number, arr?: T[]) => K) {
        return (arr: T[]) => arr.map(callback);
    }

</script>

<!-- 
    Currently, uses the slot prop to pass down networker
    Consider creating a hook to access the networker object?

    For example,

    ```js
    let { networker } = useNetworker();
    ```
-->
<slot {networker}/>