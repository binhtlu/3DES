import { useState, useEffect, useRef, memo } from 'react'
// Import các hàm mã hóa từ file encryption.js và giải mã từ decode.js
import { encrypt3DES, bitsToHex } from './utils/encryption'
import { decrypt3DES } from './utils/decode'
import CryptoJS from 'crypto-js'
import './App.css'

// Cách 1: Đọc từng byte một (ASCII)
const bitsToASCIIText = (bitsArray) => {
  if (!bitsArray || bitsArray.length === 0) return "";
  let text = "";
  for (let i = 0; i < bitsArray.length; i += 8) {
    const byte = parseInt(bitsArray.slice(i, i + 8).join(''), 2);
    text += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '·';
  }
  return text.length > 8 ? text.slice(-8) : text;
}

// Cách 2: Sử dụng TextDecoder (UTF-8)
const bitsToText = (bitsArray) => {
  if (!bitsArray || bitsArray.length === 0) return "";
  try {
    const bytes = [];
    for (let i = 0; i < bitsArray.length; i += 8) {
      bytes.push(parseInt(bitsArray.slice(i, i + 8).join(''), 2));
    }
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(new Uint8Array(bytes));
  } catch (e) {
    return "········";
  }
}

// Component hiển thị từng bước được tối ưu hóa bằng React.memo
const StepItem = memo(({ step, index, showExplainer = false, bitsToHex, bitsToText, bitsToASCIIText }) => {
  const isHeader = step.type.includes('BẮT ĐẦU') || step.type.includes('KẾT THÚC') || step.type === 'IP' || step.type === 'FP'
  const parentColors = {
    'K1': 'border-l-blue-500 bg-blue-500',
    'K2': 'border-l-emerald-500 bg-emerald-500',
    'K3': 'border-l-amber-500 bg-amber-500'
  }

  return (
    <div 
      className={`flex items-center gap-6 p-4 rounded-2xl border-2 transition-all duration-300 animate-in slide-in-from-right-4
        ${isHeader ? 'bg-slate-900 text-white font-black border-slate-800' : 'bg-white border-slate-50 hover:border-indigo-100 shadow-sm'} 
        ${step.parent ? `border-l-[12px] ${parentColors[step.parent].split(' ')[0]}` : ''}
      `}
    >
      <span className={`min-w-[150px] text-xs font-black uppercase tracking-widest ${isHeader ? 'text-sky-400' : 'text-slate-400'}`}>
        {step.type}
      </span>
      
      {step.parent && (
        <span className={`text-xs px-4 py-1.5 rounded-full text-white font-black shadow-sm ${parentColors[step.parent].split(' ')[1]}`}>
          {step.parent}
        </span>
      )}

      <div className="flex-1 flex flex-wrap items-center gap-6">
        {step.bits && (
          <div className="flex items-center gap-2">
            <code className="text-sm text-slate-600 font-black font-mono bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-inner">
              {bitsToHex(step.bits)}
            </code>
            {(step.bits.length === 64 || step.cumulativeBitsAtStep) && (
              <span className="text-[11px] font-black bg-amber-500 text-white px-3 py-1.5 rounded-lg shadow-sm border-2 border-amber-400">
                [{bitsToText(step.cumulativeBitsAtStep || step.bits)}]
              </span>
            )}
          </div>
        )}
        
        {step.L && (
          <div className="flex gap-8 text-base font-black font-mono overflow-hidden">
            <span className="flex items-center gap-2">
              <span className="text-[10px] text-slate-900 uppercase tracking-tighter">Left:</span>
              <code className="text-indigo-900 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{bitsToHex(step.L)}</code>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[10px] text-slate-900 uppercase tracking-tighter">Right:</span>
              <code className="text-indigo-900 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{bitsToHex(step.R)}</code>
            </span>
          </div>
        )}
        
        {step.result && (
          <div className="flex flex-col items-start gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-300 font-bold uppercase rotate-90">RES:</span>
              <code className="text-base font-black font-mono text-indigo-700 bg-indigo-50 px-5 py-2.5 rounded-2xl border-2 border-indigo-100 shadow-lg">
                {bitsToHex(step.result)}
              </code>
            </div>

            {showExplainer && (step.type.includes('KẾT THÚC') || step.type.includes('FP')) && (step.result || step.bits) && (
              <div className="flex flex-col gap-4 mt-2 w-full animate-in flip-in-x duration-700 delay-300">
                  <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-200 shadow-sm">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-amber-900 overflow-x-auto py-2">
                      <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black uppercase opacity-60 mb-2">1. Văn bản thô</span>
                          <div className="px-5 py-3 rounded-2xl bg-white border-2 border-amber-200 font-bold text-lg text-slate-400">
                            "{bitsToASCIIText(step.cumulativeBitsAtStep || step.result)}"
                          </div>
                      </div>
                      <span className="text-2xl opacity-30 font-black">→</span>
                      <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black uppercase opacity-60 mb-2">2. Decoder</span>
                          <div className="px-5 py-3 rounded-2xl bg-slate-900 border-2 border-slate-800 font-mono text-[11px] text-amber-500 font-black">
                            TextDecoder('utf-8')
                          </div>
                      </div>
                      <span className="text-2xl opacity-30 font-black">→</span>
                      <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black uppercase opacity-60 mb-2">3. Kết quả</span>
                          <div className="px-6 py-3 rounded-2xl bg-indigo-600 border-2 border-indigo-400 font-black text-xl text-white italic">
                            "{bitsToText(step.cumulativeBitsAtStep || step.result)}"
                          </div>
                      </div>
                    </div>
                  </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

function App() {
  const [inputText, setInputText] = useState('Hello xin chào')
  const [hexInput, setHexInput] = useState('')
  const [key, setKey] = useState('0123456789ABCDEFFEDCBA98765432100123456789ABCDEF')
  const [encryptResult, setEncryptResult] = useState('')
  const [decryptResult, setDecryptResult] = useState('')
  const [encryptSteps, setEncryptSteps] = useState([])
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [encryptTime, setEncryptTime] = useState(0)
  const [decryptSteps, setDecryptSteps] = useState([])
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptTime, setDecryptTime] = useState(0)
  const [aesResult, setAesResult] = useState('')
  const [aesTime, setAesTime] = useState(0)
  const [isAesEncrypting, setIsAesEncrypting] = useState(false)

  const handleProcess = async (mode) => {
    const startTime = performance.now()
    const allSteps = []
    let cumulativeBits = []
    
    if (mode === 'encrypt') {
      setIsEncrypting(true)
      setEncryptSteps([])
      setEncryptTime(0)
      setEncryptResult('')
      
      try {
        const cryptoStartTime = performance.now()
        const res = encrypt3DES(inputText, key, (step, blockIdx) => {
          const currentTotal = (step.type.includes('3DES') || step.type === 'IP' || step.type === 'FP' || step.type === 'RES')
            ? [...cumulativeBits, ...(step.result || step.bits || step.L || step.R || [])]
            : cumulativeBits;
          allSteps.push({ ...step, blockIdx, cumulativeBitsAtStep: currentTotal })
          if (step.type === 'KẾT THÚC 3DES') cumulativeBits = [...cumulativeBits, ...step.result]
        })
        const cryptoEndTime = performance.now()
        setEncryptResult(res)
        setEncryptTime(Number((cryptoEndTime - cryptoStartTime).toFixed(3))) // Thời gian mã hóa thực tế
        
        const chunkSize = 24
        for (let i = 0; i < allSteps.length; i += chunkSize) {
          const chunk = allSteps.slice(i, i + chunkSize)
          setEncryptSteps(prev => [...prev, ...chunk])
          await new Promise(r => setTimeout(r, 10)) 
        }
      } catch (e) { alert("Lỗi Mã hóa!"); }
      finally { setIsEncrypting(false); }
      
    } else {
      setIsDecrypting(true)
      setDecryptSteps([])
      setDecryptTime(0)
      setDecryptResult('')

      try {
        const cryptoStartTime = performance.now()
        const res = decrypt3DES(hexInput, key, (step, blockIdx) => {
          const currentTotal = (step.type.includes('3DES') || step.type === 'IP' || step.type === 'FP' || step.result)
            ? [...cumulativeBits, ...(step.result || step.bits || step.L || step.R || [])]
            : cumulativeBits;
          allSteps.push({ ...step, blockIdx, cumulativeBitsAtStep: currentTotal })
          if (step.type === 'KẾT THÚC 3DES') cumulativeBits = [...cumulativeBits, ...step.result]
        })
        const cryptoEndTime = performance.now()
        setDecryptResult(res)
        setDecryptTime(Number((cryptoEndTime - cryptoStartTime).toFixed(3))) // Thời gian giải mã thực tế
        
        const chunkSize = 24
        for (let i = 0; i < allSteps.length; i += chunkSize) {
          const chunk = allSteps.slice(i, i + chunkSize)
          setDecryptSteps(prev => [...prev, ...chunk])
          await new Promise(r => setTimeout(r, 10)) 
        }
      } catch (e) { alert("Lỗi Giải mã!"); }
      finally { setIsDecrypting(false); }
    }
  }

  const handleAESProcess = () => {
    setIsAesEncrypting(true)
    setAesResult('')
    setAesTime(0)
    setTimeout(() => {
      const startTime = performance.now()
      try {
        const parsedKey = CryptoJS.enc.Hex.parse(key);
        const encrypted = CryptoJS.TripleDES.encrypt(inputText, parsedKey, {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7
        });
        const libHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
        const ciphertext = CryptoJS.AES.encrypt(inputText, key).toString()
        const endTime = performance.now()
        setAesResult(ciphertext)
        setAesTime(endTime - startTime)
        console.log("3DES Library Matching Hex:", libHex)
      } catch (e) { alert("Lỗi AES!"); }
      finally { setIsAesEncrypting(false); }
    }, 0)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="text-center space-y-3 pb-4">
          <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">
            3DES <span className="text-indigo-600">Lab Suite</span>
          </h1>
          <p className="text-slate-400 font-bold italic">Hệ thống mô phỏng mật mã học Triple DES quy mô lớn</p>
        </header>

        <main className="space-y-14 pb-24">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200  backdrop-blur-xl bg-white/95">
             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <label className="text-sm font-black text-indigo-600 uppercase">Khóa chung mật mã (24 Bytes Hex)</label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="px-6 py-4 rounded-2xl bg-slate-100 border-none focus:ring-4 font-mono text-indigo-700 font-black lg:w-3/4 tracking-widest shadow-inner"
                />
             </div>
          </div>

          <section className="space-y-8">
            <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-200 space-y-10">
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Quy trình Mã hóa (Encryption)</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2">
                  <textarea
                    rows="4"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full px-8 py-6 rounded-[2rem] bg-slate-50 border-none focus:ring-8 text-lg font-bold text-slate-700 resize-none shadow-inner"
                    placeholder="Nhập nội dung vào đây..."
                  />
                </div>
                <button onClick={() => handleProcess('encrypt')} disabled={isEncrypting} className="rounded-[2rem] font-black text-xl text-white bg-indigo-600 hover:bg-slate-900 transition-all uppercase">{isEncrypting ? '...' : '🔒 BẮT ĐẦU MÃ HÓA'}</button>
              </div>
              {encryptResult && (
                <div className="bg-slate-950 p-8 rounded-[3rem] border-8 border-slate-900">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-[0.2em]">BẢN MÃ HEXADECIMAL (OUTPUT)</p>
                    {encryptTime > 0 && (
                      <span className="text-[10px] bg-indigo-500 text-white px-4 py-1.5 rounded-full font-black shadow-lg shadow-indigo-500/20 animate-in fade-in zoom-in duration-500">
                        ⚡ {encryptTime} ms
                      </span>
                    )}
                  </div>
                  <code className="text-lg text-sky-400 font-mono break-all block bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    {encryptResult}
                  </code>
                  <button 
                    onClick={() => {navigator.clipboard.writeText(encryptResult); setHexInput(encryptResult)}} 
                    className="mt-6 text-xs bg-indigo-600 hover:bg-white hover:text-indigo-600 transition-all text-white px-8 py-3 rounded-2xl uppercase font-black tracking-widest shadow-xl"
                  >
                    Tự động chuyển tiếp ↓
                  </button>
                </div>
              )}
            </div>

            <div className={`bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 flex flex-col h-[700px] transition-all duration-700 ${encryptSteps.length ? 'opacity-100' : 'opacity-30 blur-[2px]'}`}>
               <div className="flex justify-between items-center mb-8 bg-indigo-50 p-6 rounded-[2rem]">
                 <h3 className="text-sm font-black text-indigo-900 uppercase">TIMELINE I: PHÂN TÍCH MÔ PHỎNG</h3>
                 {encryptTime > 0 && <span className="text-xs font-black text-indigo-700 bg-white px-4 py-2 rounded-full">HOÀN TẤT: {encryptTime} ms</span>}
               </div>
               <div className="flex-1 overflow-y-auto pr-4 space-y-2 scrollbar-thin">
                  {encryptSteps.length === 0 ? <p className="text-center text-slate-300 italic py-20">Chờ lệnh thực thi...</p> : (
                    encryptSteps.map((step, idx) => (
                      <div key={idx}>
                        {(idx === 0 || encryptSteps[idx - 1].blockIdx !== step.blockIdx) && (
                          <div className="sticky top-0 z-40 py-4 bg-white/90 font-black text-sm uppercase text-slate-900">DỮ LIỆU KHỐI #{step.blockIdx + 1}</div>
                        )}
                        <StepItem step={step} index={idx} showExplainer={false} bitsToHex={bitsToHex} bitsToText={bitsToText} bitsToASCIIText={bitsToASCIIText} />
                      </div>
                    ))
                  )}
               </div>
            </div>
          </section>

          <section className="space-y-8">
            <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-emerald-100 border-t-[16px] border-t-emerald-500 space-y-10">
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Quy trình Giải mã (Decryption)</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                 <div className="lg:col-span-2">
                   <textarea rows="4" value={hexInput} onChange={(e) => setHexInput(e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-emerald-50/30 border-none font-mono text-slate-800 shadow-inner" placeholder="Chưa có dữ liệu Hex..." />
                 </div>
                 <button onClick={() => handleProcess('decrypt')} disabled={isDecrypting} className="rounded-[2rem] font-black text-xl text-white bg-emerald-600 hover:bg-slate-900 transition-all uppercase">🔓 GIẢI MÃ</button>
              </div>
              {decryptResult && (
                <div className="bg-emerald-50 p-10 rounded-[3rem] border-4 border-emerald-200 shadow-xl shadow-emerald-900/5 transition-all">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-[0.2em]">KẾT QUẢ KHÔI PHỤC (TEXT RECOVERY)</p>
                    {decryptTime > 0 && (
                      <span className="text-xs bg-emerald-600 text-white px-5 py-2 rounded-full font-black shadow-lg shadow-emerald-500/20 animate-in slide-in-from-right-4 duration-500">
                        ⚡ {decryptTime} ms
                      </span>
                    )}
                  </div>
                  <p className="text-3xl text-emerald-950 font-black italic select-all leading-tight">"{decryptResult}"</p>
                </div>
              )}
            </div>

            <div className={`bg-white p-10 rounded-[3.5rem] shadow-xl border border-emerald-50 flex flex-col h-[700px] transition-all duration-700 ${decryptSteps.length ? 'opacity-100' : 'opacity-30 blur-[2px]'}`}>
               <div className="flex justify-between items-center mb-8 bg-emerald-50 p-6 rounded-[2rem]">
                 <h3 className="text-sm font-black text-emerald-950 uppercase">TIMELINE II: PHÂN TÍCH GIẢI MÃ</h3>
                 {decryptTime > 0 && <span className="text-xs font-black text-emerald-700 bg-white px-4 py-2 rounded-full">HOÀN TẤT: {decryptTime} ms</span>}
               </div>
               <div className="flex-1 overflow-y-auto pr-4 space-y-2 scrollbar-thin">
                  {decryptSteps.length === 0 ? <p className="text-center text-slate-300 italic py-20">Hệ thống đang chờ...</p> : (
                    decryptSteps.map((step, idx) => (
                      <div key={idx}>
                        {(idx === 0 || decryptSteps[idx - 1].blockIdx !== step.blockIdx) && (
                          <div className="sticky top-0 z-40 py-4 bg-white/90 font-black text-sm uppercase text-slate-900">DỮ LIỆU KHỐI #{step.blockIdx + 1}</div>
                        )}
                        <StepItem step={step} index={idx} showExplainer={true} bitsToHex={bitsToHex} bitsToText={bitsToText} bitsToASCIIText={bitsToASCIIText} />
                      </div>
                    ))
                  )}
               </div>
            </div>
          </section>

          <section className="space-y-8">
            <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl border-4 border-indigo-500/30 space-y-10 group overflow-hidden relative">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-8 relative z-10">
                <div className="flex items-center gap-5">
                   <div className="bg-gradient-to-br from-indigo-500 to-sky-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl">AES</div>
                   <div>
                     <h2 className="text-3xl font-black text-white uppercase">Advanced Encryption Standard</h2>
                     <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mt-1">Sử dụng thư viện CryptoJS</p>
                   </div>
                </div>
                {aesTime > 0 && (
                  <div className="bg-indigo-500 text-white px-6 py-2 rounded-2xl font-black text-lg">{aesTime.toFixed(4)} ms</div>
                )}
              </div>
              <button onClick={handleAESProcess} disabled={isAesEncrypting || !inputText} className="w-full h-20 rounded-[2rem] font-black text-xl text-white bg-indigo-600 hover:bg-white hover:text-indigo-900 transition-all uppercase">{isAesEncrypting ? '⚡ XỬ LÝ...' : '⚡ MÃ HÓA AES'}</button>
              {aesResult && <code className="block bg-slate-950 p-8 rounded-3xl text-indigo-100 break-all">{aesResult}</code>}
            </div>
          </section>
        </main>
        <footer className="text-center py-16 border-t-2 border-slate-100 opacity-50">
          <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em]">3DES Visual Suite Premium</p>
        </footer>
      </div>
    </div>
  )
}

export default App
