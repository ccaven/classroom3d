
type Vector3 = { x: number, y: number, z: number };
type Quaternion = { x: number, y: number, z: number, w: number };

type Update<K extends string, P> = { key: K, payload: P };

export type AnyUpdate = Update<any, any>

export type PositionUpdate = Update<"position-update", {
    position: Vector3,
    rotation: Quaternion,
    velocity: Vector3
}>;

export type UserListUpdate = Update<"user-list", string[]>;

export type PingUpdate = Update<"ping", null>;