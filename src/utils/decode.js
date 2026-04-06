/**
 * Logic Giải mã Triple DES (3DES) tách biệt
 */
import { desProcess, generateSubkeys, hexToBits, bitsToHex } from './encryption';

/**
 * Chuyển mảng bit sang mảng byte
 */
function bitsToBytes(bits) {
    let bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
        bytes.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    }
    return bytes;
}

/**
 * Loại bỏ Padding PKCS7
 */
function unpadPKCS7(bytes) {
    const padLen = bytes[bytes.length - 1];
    if (padLen < 1 || padLen > 8) return bytes;
    // Kiểm tra xem tất cả các byte padding có giá trị bằng padLen không
    for(let i = 1; i <= padLen; i++) {
        if(bytes[bytes.length - i] !== padLen) return bytes;
    }
    return bytes.slice(0, bytes.length - padLen);
}

/**
 * Giải mã 3DES: D(K3) -> E(K2) -> D(K1)
 */
export function tripleDESDecrypt(block64, keys, onStep = null) {
    const { K1_16, K2_16, K3_16 } = keys;
    
    if (onStep) onStep({ type: 'BẮT ĐẦU GIẢI MÃ 3DES', block: block64 });
    
    // Bước 1: Giải mã DES với khóa 3
    let step1 = desProcess(block64, K3_16, 'decrypt', (s) => onStep && onStep({ ...s, parent: 'K3' }));
    // Bước 2: Mã hóa DES với khóa 2
    let step2 = desProcess(step1, K2_16, 'encrypt', (s) => onStep && onStep({ ...s, parent: 'K2' }));
    // Bước 3: Giải mã DES với khóa 1
    let final = desProcess(step2, K1_16, 'decrypt', (s) => onStep && onStep({ ...s, parent: 'K1' }));
    
    if (onStep) onStep({ type: 'KẾT THÚC GIẢI MÃ 3DES', result: final });
    return final;
}

/**
 * Hàm bao (Wrapper) thực hiện toàn bộ quá trình giải mã 3DES cho chuỗi Hex
 */
export function decrypt3DES(hexStr, keyHex, onProgress) {
    // 3DES cần 24 bytes (48 ký tự hex) chia thành 3 khóa 8 bytes
    const fullKeyBits = hexToBits(keyHex.padEnd(48, '0').substring(0, 48));
    const K1_16 = generateSubkeys(fullKeyBits.slice(0, 64));
    const K2_16 = generateSubkeys(fullKeyBits.slice(64, 128));
    const K3_16 = generateSubkeys(fullKeyBits.slice(128, 192));
    
    const bitStream = hexToBits(hexStr);
    let decryptedBits = [];
    
    // Xử lý từng khối 64 bit
    for (let i = 0; i < bitStream.length; i += 64) {
        let block = bitStream.slice(i, i + 64);
        decryptedBits.push(...tripleDESDecrypt(block, { K1_16, K2_16, K3_16 }, (step) => {
            if (onProgress) onProgress(step, i / 64);
        }));
    }
    
    const bytes = unpadPKCS7(bitsToBytes(decryptedBits));
    return new TextDecoder().decode(new Uint8Array(bytes));
}
