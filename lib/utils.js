/**
 * Converte um array comum em typed array e preserva typed arrays existentes.
 */
export function toTypedArray(data, ArrayType = Float32Array) {
    if (ArrayBuffer.isView(data)) {
        return data;
    }

    if (Array.isArray(data)) {
        return new ArrayType(data);
    }

    throw new Error('Expected an array or typed array.');
}

/**
 * Cria uma matriz identidade 4x4 em ordem column-major.
 */
export function createIdentityMat4() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]);
}

/**
 * Multiplica duas matrizes 4x4 em ordem column-major.
 */
export function multiplyMat4(a, b) {
    const out = new Float32Array(16);

    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
    const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
    const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
    const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

    out[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;

    out[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;

    out[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;

    out[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    out[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    out[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    out[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;

    return out;
}

/**
 * Cria uma matriz de translação 4x4.
 */
export function createTranslationMat4(tx, ty, tz) {
    const out = createIdentityMat4();
    out[12] = tx;
    out[13] = ty;
    out[14] = tz;
    return out;
}

/**
 * Cria uma matriz de escala 4x4.
 */
export function createScaleMat4(sx, sy, sz) {
    const out = createIdentityMat4();
    out[0] = sx;
    out[5] = sy;
    out[10] = sz;
    return out;
}

/**
 * Cria uma matriz de visão: posiciona a câmera em eye, olhando para at.
 * O eixo Y da câmera é orientado por up e a matriz usa ordem column-major.
 */
export function createLookAtMat4(eye, at, up) {
    let zx = at[0] - eye[0];
    let zy = at[1] - eye[1];
    let zz = at[2] - eye[2];
    let length = Math.hypot(zx, zy, zz);

    if (length === 0) {
        throw new Error('Camera eye and target must be different.');
    }

    zx /= length;
    zy /= length;
    zz /= length;

    // Gram-Schmidt: remove de up sua componente na direção da câmera.
    const upDotZ = up[0] * zx + up[1] * zy + up[2] * zz;
    let yx = up[0] - upDotZ * zx;
    let yy = up[1] - upDotZ * zy;
    let yz = up[2] - upDotZ * zz;
    length = Math.hypot(yx, yy, yz);

    if (length === 0) {
        throw new Error('Camera up vector must not be parallel to its direction.');
    }

    yx /= length;
    yy /= length;
    yz /= length;

    // O produto vetorial completa a base ortonormal com o eixo da direita.
    const xx = yy * zz - yz * zy;
    const xy = yz * zx - yx * zz;
    const xz = yx * zy - yy * zx;

    return new Float32Array([
        xx, yx, zx, 0,
        xy, yy, zy, 0,
        xz, yz, zz, 0,
        -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
        -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
        -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
        1,
    ]);
}

/**
 * Cria uma matriz de rotação em torno do eixo X.
 */
export function createRotationXMat4(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return new Float32Array([
        1, 0, 0, 0,
        0, cos, -sin, 0,
        0, sin, cos, 0,
        0, 0, 0, 1,
    ]);
}


/**
 * Cria uma matriz de rotação em torno do eixo Y.
 */
export function createRotationYMat4(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return new Float32Array([
        cos, 0, -sin, 0,
        0, 1, 0, 0,
        sin, 0, cos, 0,
        0, 0, 0, 1,
    ]);
}

/**
 * Cria uma matriz de rotação em torno do eixo Z.
 */
export function createRotationZMat4(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return new Float32Array([
        cos, sin, 0, 0,
        -sin, cos, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]);
}
