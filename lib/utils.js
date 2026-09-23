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
 * Cria a inversa de uma matriz 4x4 em ordem column-major.
 */
export function createInverseMat4(matrix) {
    const m00 = matrix[0], m01 = matrix[1], m02 = matrix[2], m03 = matrix[3];
    const m10 = matrix[4], m11 = matrix[5], m12 = matrix[6], m13 = matrix[7];
    const m20 = matrix[8], m21 = matrix[9], m22 = matrix[10], m23 = matrix[11];
    const m30 = matrix[12], m31 = matrix[13], m32 = matrix[14], m33 = matrix[15];

    const b00 = m00 * m11 - m01 * m10;
    const b01 = m00 * m12 - m02 * m10;
    const b02 = m00 * m13 - m03 * m10;
    const b03 = m01 * m12 - m02 * m11;
    const b04 = m01 * m13 - m03 * m11;
    const b05 = m02 * m13 - m03 * m12;
    const b06 = m20 * m31 - m21 * m30;
    const b07 = m20 * m32 - m22 * m30;
    const b08 = m20 * m33 - m23 * m30;
    const b09 = m21 * m32 - m22 * m31;
    const b10 = m21 * m33 - m23 * m31;
    const b11 = m22 * m33 - m23 * m32;

    const determinant = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (determinant === 0) {
        throw new Error('Matrix must be invertible.');
    }

    const invDet = 1 / determinant;

    const inverse = new Float32Array([
        (m11 * b11 - m12 * b10 + m13 * b09) * invDet,
        (m12 * b08 - m10 * b11 - m13 * b07) * invDet,
        (m10 * b10 - m11 * b08 + m13 * b06) * invDet,
        (m11 * b07 - m10 * b09 - m12 * b06) * invDet,
        (m02 * b10 - m01 * b11 - m03 * b09) * invDet,
        (m00 * b11 - m02 * b08 + m03 * b07) * invDet,
        (m01 * b08 - m00 * b10 - m03 * b06) * invDet,
        (m00 * b09 - m01 * b07 + m02 * b06) * invDet,
        (m31 * b05 - m32 * b04 + m33 * b03) * invDet,
        (m32 * b02 - m30 * b05 - m33 * b01) * invDet,
        (m30 * b04 - m31 * b02 + m33 * b00) * invDet,
        (m31 * b01 - m30 * b03 - m32 * b00) * invDet,
        (m22 * b04 - m21 * b05 - m23 * b03) * invDet,
        (m20 * b05 - m22 * b02 + m23 * b01) * invDet,
        (m21 * b02 - m20 * b04 - m23 * b00) * invDet,
        (m20 * b03 - m21 * b01 + m22 * b00) * invDet,
    ]);

    return createTransposeMat4(inverse);
}

/**
 * Cria a transposta de uma matriz 4x4 em ordem column-major.
 */
export function createTransposeMat4(matrix) {
    return new Float32Array([
        matrix[0], matrix[4], matrix[8], matrix[12],
        matrix[1], matrix[5], matrix[9], matrix[13],
        matrix[2], matrix[6], matrix[10], matrix[14],
        matrix[3], matrix[7], matrix[11], matrix[15],
    ]);
}

/**
 * Cria a matriz normal transpose(inverse(modelView)).
 */
export function createNormalMat4(modelView) {
    return createTransposeMat4(createInverseMat4(modelView));
}

/**
 * Calcula o vetor normal unitário de um triângulo definido por três vértices.
 */
export function calculateTriangleNormal(a, b, c) {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const normal = [
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0],
    ];
    const length = Math.hypot(normal[0], normal[1], normal[2]);

    return length === 0
        ? [0, 0, 0]
        : [normal[0] / length, normal[1] / length, normal[2] / length];
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
export function createLookAtMat4(eye, at, up, rightHanded = false) {
    let zx = rightHanded ? eye[0] - at[0] : at[0] - eye[0];
    let zy = rightHanded ? eye[1] - at[1] : at[1] - eye[1];
    let zz = rightHanded ? eye[2] - at[2] : at[2] - eye[2];
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
 * Cria uma matriz de projeção ortográfica para o intervalo de profundidade do WebGPU [0, 1].
 */
export function createOrthographicMat4(left, right, bottom, top, near, far) {
    if (left === right || bottom === top || near === far) {
        throw new Error('Orthographic projection bounds must define a volume.');
    }

    return new Float32Array([
        2 / (right - left), 0, 0, 0,
        0, 2 / (top - bottom), 0, 0,
        0, 0, -1 / (far - near), 0,
        -(right + left) / (right - left),
        -(top + bottom) / (top - bottom),
        -near / (far - near),
        1,
    ]);
}

/**
 * Cria uma matriz de projeção perspectiva para o intervalo de profundidade do WebGPU [0, 1].
 * fovy é o campo de visão vertical em radianos.
 */
export function createPerspectiveMat4(fovy, aspect, near, far) {
    if (fovy <= 0 || fovy >= Math.PI || aspect <= 0 || near <= 0 || far <= near) {
        throw new Error('Perspective projection parameters are invalid.');
    }

    const f = 1 / Math.tan(fovy / 2);

    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, -far / (far - near), -1,
        0, 0, -(far * near) / (far - near), 0,
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
