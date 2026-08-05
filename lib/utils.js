export function toTypedArray(data, ArrayType = Float32Array) {
    if (ArrayBuffer.isView(data)) {
        return data;
    }

    if (Array.isArray(data)) {
        return new ArrayType(data);
    }

    throw new Error('Expected an array or typed array.');
}
