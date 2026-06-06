export const unitiumDebugTestMetadataKey = Symbol("unitium.debugTest");

export type UnitiumDebuggableMethod = Function & {
    [unitiumDebugTestMetadataKey]?: string;
};
