import type RAPIER from "@dimforge/rapier3d-compat";

export function normalized({ x, y, z, w }: RAPIER.Quaternion) {
    let m = 1.0 / Math.sqrt(x * x + y * y + z * z + w * w);
    return {
        x: x * m,
        y: y * m,
        z: z * m,
        w: w * m
    };
}

export * from './hooks';
export * from './uid';