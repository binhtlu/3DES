/**
 * Triển khai thuật toán DES/3DES với các hằng số và hàm tiện ích
 */

// Bảng hoán vị khởi đầu (Initial Permutation - IP)
const IP = [
    58, 50, 42, 34, 26, 18, 10, 2,
    60, 52, 44, 36, 28, 20, 12, 4,
    62, 54, 46, 38, 30, 22, 14, 6,
    64, 56, 48, 40, 32, 24, 16, 8,
    57, 49, 41, 33, 25, 17, 9, 1,
    59, 51, 43, 35, 27, 19, 11, 3,
    61, 53, 45, 37, 29, 21, 13, 5,
    63, 55, 47, 39, 31, 23, 15, 7
];

// Bảng hoán vị cuối cùng (Final Permutation - FP / Inverse IP)
const FP = [
    40, 8, 48, 16, 56, 24, 64, 32,
    39, 7, 47, 15, 55, 23, 63, 31,
    38, 6, 46, 14, 54, 22, 62, 30,
    37, 5, 45, 13, 53, 21, 61, 29,
    36, 4, 44, 12, 52, 20, 60, 28,
    35, 3, 43, 11, 51, 19, 59, 27,
    34, 2, 42, 10, 50, 18, 58, 26,
    33, 1, 41, 9, 49, 17, 57, 25
];

// Bảng mở rộng (Expansion Table - E): 32 bit -> 48 bit
const E = [
    32, 1, 2, 3, 4, 5,
    4, 5, 6, 7, 8, 9,
    8, 9, 10, 11, 12, 13,
    12, 13, 14, 15, 16, 17,
    16, 17, 18, 19, 20, 21,
    20, 21, 22, 23, 24, 25,
    24, 25, 26, 27, 28, 29,
    28, 29, 30, 31, 32, 1
];

// Bảng hoán vị P (Permutation P): 32 bit -> 32 bit
const P = [
    16, 7, 20, 21,
    29, 12, 28, 17,
    1, 15, 23, 26,
    5, 18, 31, 10,
    2, 8, 24, 14,
    32, 27, 3, 9,
    19, 13, 30, 6,
    22, 11, 4, 25
];

// Các hộp S (S-Boxes): Biến đổi 6 bit thành 4 bit
const S_BOXES = [
    [
        [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
        [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
        [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
        [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13]
    ],
    [
        [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
        [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
        [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
        [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9]
    ],
    [
        [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
        [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
        [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
        [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12]
    ],
    [
        [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
        [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
        [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
        [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14]
    ],
    [
        [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
        [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
        [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
        [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3]
    ],
    [
        [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
        [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
        [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
        [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13]
    ],
    [
        [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
        [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
        [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
        [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12]
    ],
    [
        [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
        [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
        [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
        [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11]
    ]
];

// Bảng hoán vị chọn khóa PC-1: 64 bit -> 56 bit
const PC1 = [
    57, 49, 41, 33, 25, 17, 9,
    1, 58, 50, 42, 34, 26, 18,
    10, 2, 59, 51, 43, 35, 27,
    19, 11, 3, 60, 52, 44, 36,
    63, 55, 47, 39, 31, 23, 15,
    7, 62, 54, 46, 38, 30, 22,
    14, 6, 61, 53, 45, 37, 29,
    21, 13, 5, 28, 20, 12, 4
];

// Bảng hoán vị nén khóa PC-2: 56 bit -> 48 bit
const PC2 = [
    14, 17, 11, 24, 1, 5,
    3, 28, 15, 6, 21, 10,
    23, 19, 12, 4, 26, 8,
    16, 7, 27, 20, 13, 2,
    41, 52, 31, 37, 47, 55,
    30, 40, 51, 45, 33, 48,
    44, 49, 39, 56, 34, 53,
    46, 42, 50, 36, 29, 32
];

// Số lần dịch trái cho mỗi vòng tạo khóa con
const SHIFTS = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];

/**
 * Hàm hoán vị tổng quát
 * @param {Array} bits - Mảng bit đầu vào
 * @param {Array} table - Bảng hoán vị
 * @returns {Array} Mảng bit đã được hoán vị
 */
function permute(bits, table) {
    return table.map(pos => bits[pos - 1]);
}

/**
 * Lấy đầu ra từ hộp S
 * @param {Array} bits6 - 6 bit đầu vào
 * @param {Array} sBox - Ma trận hộp S
 * @returns {Array} 4 bit đầu ra
 */
function getSBoxOutput(bits6, sBox) {
    // Bit 1 và 6 xác định dòng
    const row = parseInt(bits6[0].toString() + bits6[5].toString(), 2);
    // Bit 2, 3, 4, 5 xác định cột
    const col = parseInt(bits6.slice(1, 5).join(''), 2);
    const val = sBox[row][col];
    return val.toString(2).padStart(4, '0').split('').map(Number);
}

/**
 * Tạo 16 khóa con từ khóa chính 64 bit
 * @param {Array} key64 - Mảng 64 bit khóa
 * @returns {Array} Mảng chứa 16 khóa con (mỗi khóa 48 bit)
 */
export function generateSubkeys(key64) {
    let bits = key64;
    let permutedKey = permute(bits, PC1);
    let C = permutedKey.slice(0, 28);
    let D = permutedKey.slice(28, 56);
    let subkeys = [];

    for (let i = 0; i < 16; i++) {
        const shiftCount = SHIFTS[i];
        // Dịch vòng trái
        C = [...C.slice(shiftCount), ...C.slice(0, shiftCount)];
        D = [...D.slice(shiftCount), ...D.slice(0, shiftCount)];
        subkeys.push(permute([...C, ...D], PC2));
    }
    return subkeys;
}

/**
 * Hàm Feistel (F) trong cấu trúc DES
 * @param {Array} R - 32 bit bên phải
 * @param {Array} K - Khóa con 48 bit
 * @returns {Array} 32 bit kết quả
 */
function feistel(R, K) {
    // 1. Mở rộng 32 -> 48 bit
    let expandedR = permute(R, E);
    // 2. XOR với khóa con
    let xorResult = expandedR.map((bit, i) => bit ^ K[i]);
    // 3. Thế qua các hộp S
    let sBoxOutput = [];
    for (let i = 0; i < 8; i++) {
        const sixBits = xorResult.slice(i * 6, (i + 1) * 6);
        sBoxOutput.push(...getSBoxOutput(sixBits, S_BOXES[i]));
    }
    // 4. Hoán vị P
    return permute(sBoxOutput, P);
}

/**
 * Xử lý một khối 64 bit qua DES
 * @param {Array} block64 - Khối 64 bit
 * @param {Array} keys16 - 16 khóa con
 * @param {string} mode - 'encrypt' hoặc 'decrypt'
 * @param {function} onStep - Callback để theo dõi các bước
 */
export function desProcess(block64, keys16, mode = 'encrypt', onStep = null) {
    // Bước 1: Hoán vị khởi đầu
    let bits = permute(block64, IP);
    if (onStep) onStep({ type: 'IP (Hoán vị khởi đầu)', bits: [...bits] });

    let L = bits.slice(0, 32);
    let R = bits.slice(32, 64);

    // Nếu giải mã, đảo ngược thứ tự khóa con
    const actualKeys = mode === 'encrypt' ? keys16 : [...keys16].reverse();

    // 16 vòng DES
    for (let i = 0; i < 16; i++) {
        let tempR = [...R];
        let fOut = feistel(R, actualKeys[i]);
        // L_i = R_{i-1}, R_i = L_{i-1} XOR F(R_{i-1}, K_i)
        R = L.map((bit, idx) => bit ^ fOut[idx]);
        L = tempR;
        if (onStep) onStep({ type: `Vòng ${i + 1}`, L: [...L], R: [...R] });
    }

    // Kết hợp và hoán vị cuối cùng
    let finalBits = permute([...R, ...L], FP);
    if (onStep) onStep({ type: 'FP (Hoán vị cuối cùng)', bits: [...finalBits] });
    return finalBits;
}

/**
 * Chu trình Triple DES (3DES)
 * Mã hóa (K1) -> Giải mã (K2) -> Mã hóa (K3)
 */
export function tripleDES(block64, keys, onStep = null) {
    const { K1_16, K2_16, K3_16 } = keys;
    
    if (onStep) onStep({ type: 'BẮT ĐẦU 3DES', block: block64 });
    
    // Bước 1: Mã hóa DES với khóa 1
    let step1 = desProcess(block64, K1_16, 'encrypt', (s) => onStep && onStep({ ...s, parent: 'K1' }));
    // Bước 2: Giải mã DES với khóa 2
    let step2 = desProcess(step1, K2_16, 'decrypt', (s) => onStep && onStep({ ...s, parent: 'K2' }));
    // Bước 3: Mã hóa DES với khóa 3
    let final = desProcess(step2, K3_16, 'encrypt', (s) => onStep && onStep({ ...s, parent: 'K3' }));
    
    if (onStep) onStep({ type: 'KẾT THÚC 3DES', result: final });
    return final;
}

/**
 * Chuyển chuỗi thành mảng bit kèm theo Padding PKCS7
 */
export function prepareInput(str) {
    const encoder = new TextEncoder();
    let bytes = Array.from(encoder.encode(str));
    // Padding PKCS7 để độ dài chia hết cho 8 byte (64 bit)
    const padLen = 8 - (bytes.length % 8);
    for (let i = 0; i < padLen; i++) {
        bytes.push(padLen);
    }
    let allBits = [];
    bytes.forEach(b => {
        const bits = b.toString(2).padStart(8, '0').split('').map(Number);
        allBits.push(...bits);
    });
    return allBits;
}

/**
 * Chuyển mảng bit sang chuỗi Hex
 */
export function bitsToHex(bits) {
    let hex = "";
    for (let i = 0; i < bits.length; i += 4) {
        const nibble = bits.slice(i, i + 4).join('');
        hex += parseInt(nibble, 2).toString(16);
    }
    return hex;
}

/**
 * Chuyển chuỗi Hex sang mảng bit
 */
export function hexToBits(hex) {
    let bits = [];
    for (let i = 0; i < hex.length; i++) {
        const b = parseInt(hex[i], 16).toString(2).padStart(4, '0').split('').map(Number);
        bits.push(...b);
    }
    return bits;
}

/**
 * Hàm bao (Wrapper) thực hiện toàn bộ quá trình mã hóa 3DES cho văn bản
 */
export function encrypt3DES(text, keyHex, onProgress) {
    // 3DES cần 24 bytes (48 ký tự hex) chia thành 3 khóa 8 bytes
    const fullKeyBits = hexToBits(keyHex.padEnd(48, '0').substring(0, 48));
    const K1_16 = generateSubkeys(fullKeyBits.slice(0, 64));
    const K2_16 = generateSubkeys(fullKeyBits.slice(64, 128));
    const K3_16 = generateSubkeys(fullKeyBits.slice(128, 192));
    
    const bitStream = prepareInput(text);
    let encryptedBlocks = [];
    
    // Xử lý từng khối 64 bit
    for (let i = 0; i < bitStream.length; i += 64) {
        let block = bitStream.slice(i, i + 64);
        encryptedBlocks.push(tripleDES(block, { K1_16, K2_16, K3_16 }, (step) => {
            if (onProgress) onProgress(step, i / 64);
        }));
    }
    
    return encryptedBlocks.map(block => bitsToHex(block)).join('');
}