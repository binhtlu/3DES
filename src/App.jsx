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
      className={`flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 animate-in slide-in-from-right-4
        ${isHeader ? 'bg-slate-900 text-white font-black border-slate-800 shadow-md' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'} 
        ${step.parent ? `border-l-[8px] ${parentColors[step.parent].split(' ')[0]}` : ''}
      `}
    >
      <div className="flex items-center gap-3 w-full md:w-auto">
        <span className={`min-w-[140px] text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${isHeader ? 'bg-slate-800 text-sky-400' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
          {step.type}
        </span>
        {step.parent && (
          <span className={`text-[10px] px-3 py-1 rounded-full text-white font-black shadow-sm ${parentColors[step.parent].split(' ')[1]}`}>
            {step.parent}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-wrap items-center gap-4 w-full">
        {step.bits && (
          <div className="flex items-center gap-2">
            <code className="text-xs text-slate-700 font-black font-mono bg-slate-100 px-3 py-2 rounded-xl shadow-inner whitespace-nowrap">
              {bitsToHex(step.bits)}
            </code>
            {(step.bits.length === 64 || step.cumulativeBitsAtStep) && (
              <span className="text-[10px] font-black bg-amber-500 text-white px-2.5 py-1.5 rounded-lg shadow-sm border border-amber-400 whitespace-nowrap">
                [{bitsToText(step.cumulativeBitsAtStep || step.bits)}]
              </span>
            )}
          </div>
        )}
        
        {step.L && (
          <div className="flex flex-wrap md:flex-nowrap gap-4 text-sm font-black font-mono">
            <div className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-100/50">
              <span className="text-[9px] text-indigo-400 uppercase tracking-widest">Left</span>
              <code className="text-indigo-900">{bitsToHex(step.L)}</code>
            </div>
            <div className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-100/50">
              <span className="text-[9px] text-indigo-400 uppercase tracking-widest">Right</span>
              <code className="text-indigo-900">{bitsToHex(step.R)}</code>
            </div>
          </div>
        )}
        
        {step.result && (
          <div className="flex flex-col items-start gap-4 w-full">
            <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 w-full md:w-auto">
              <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">RES</span>
              <code className="text-sm font-black font-mono text-indigo-700">
                {bitsToHex(step.result)}
              </code>
            </div>

            {showExplainer && (step.type.includes('KẾT THÚC') || step.type.includes('FP')) && (step.result || step.bits) && (
              <div className="flex flex-col gap-4 mt-2 w-full animate-in flip-in-x duration-700 delay-300">
                  <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200/50 shadow-inner">
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 text-amber-900">
                      <div className="flex flex-col items-center w-full lg:w-auto">
                          <span className="text-[9px] font-black uppercase text-amber-700/60 mb-2">1. Văn bản thô (Lỗi)</span>
                          <div className="w-full text-center px-4 py-2.5 rounded-xl bg-white border border-amber-200 font-bold text-sm text-slate-400 shadow-sm truncate max-w-[200px]">
                            "{bitsToASCIIText(step.cumulativeBitsAtStep || step.result)}"
                          </div>
                      </div>
                      <span className="hidden lg:block text-amber-300 font-black">→</span>
                      <div className="flex flex-col items-center w-full lg:w-auto">
                          <span className="text-[9px] font-black uppercase text-amber-700/60 mb-2">2. UTF-8 Decoder</span>
                          <div className="w-full text-center px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[10px] text-amber-400 font-black shadow-sm">
                            TextDecoder()
                          </div>
                      </div>
                      <span className="hidden lg:block text-amber-300 font-black">→</span>
                      <div className="flex flex-col items-center w-full lg:w-auto">
                          <span className="text-[9px] font-black uppercase text-emerald-600/80 mb-2">3. Văn bản chuẩn</span>
                          <div className="w-full text-center px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-black text-base text-white shadow-md italic truncate max-w-[200px]">
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
  const [activeTab, setActiveTab] = useState('encrypt') // 'encrypt' | 'decrypt' | 'aes'

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
        setEncryptTime(Number((cryptoEndTime - cryptoStartTime).toFixed(3))) // Real execution time
        
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
        setDecryptTime(Number((cryptoEndTime - cryptoStartTime).toFixed(3)))
        
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-200">
      
      {/* HEADER TỔNG */}
      <div className="bg-slate-900 text-white pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-gradient-to-b from-indigo-500/20 to-transparent blur-3xl pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700/50 mb-4">
             <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">System Online</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter">
            3DES <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">Lab Suite</span>
          </h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">Môi trường giả lập & phân tích mật mã học Triple DES quy mô lớn. Tối ưu hóa cho kiểm tra tính toàn vẹn dư liệu.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-12 relative z-20 space-y-8 pb-24">
        
        {/* GLOBAL KEY CONFIGURATION */}
        <div className="bg-white/80 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white">
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Khóa chung mật mã
                </label>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yêu cầu chuẩn 24 Bytes Hex (48 ký tự)</p>
              </div>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full lg:w-2/3 px-6 py-4 rounded-xl bg-slate-100/50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-base md:text-lg text-slate-700 font-bold tracking-widest text-center shadow-inner"
              />
           </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex flex-wrap justify-center gap-3 bg-white p-2.5 rounded-full shadow-lg shadow-slate-200/50 border border-slate-100 touch-pan-x overflow-x-auto mx-auto max-w-fit">
           <button 
             onClick={() => setActiveTab('encrypt')} 
             className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-full font-black text-[11px] md:text-sm uppercase tracking-widest transition-all ${activeTab === 'encrypt' ? 'bg-indigo-600 text-white shadow-md scale-100' : 'text-slate-500 hover:bg-slate-50 scale-95 hover:scale-100'}`}
           >
             <span>🔒</span> Mã hóa 3DES
           </button>
           <button 
             onClick={() => setActiveTab('decrypt')} 
             className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-full font-black text-[11px] md:text-sm uppercase tracking-widest transition-all ${activeTab === 'decrypt' ? 'bg-emerald-600 text-white shadow-md scale-100' : 'text-slate-500 hover:bg-slate-50 scale-95 hover:scale-100'}`}
           >
             <span>🔓</span> Giải mã 3DES
           </button>
           <div className="w-px h-8 bg-slate-200 my-auto hidden md:block"></div>
           <button 
             onClick={() => setActiveTab('aes')} 
             className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-full font-black text-[11px] md:text-sm uppercase tracking-widest transition-all ${activeTab === 'aes' ? 'bg-slate-900 text-white shadow-md scale-100' : 'text-slate-500 hover:bg-slate-50 scale-95 hover:scale-100'}`}
           >
             <span>⚡</span> Đánh giá AES
           </button>
        </div>

        {/* CONTENT PANELS */}
        <div className="mt-8 relative">

          {/* MÃ HÓA 3DES */}
          {activeTab === 'encrypt' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-indigo-900/5 border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl">1</div>
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Quy trình Mã hóa (Encryption)</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Văn bản gốc cần bảo mật</label>
                    <textarea
                      rows="5"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="w-full px-6 py-6 rounded-[2rem] bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-base md:text-lg font-medium text-slate-700 resize-none shadow-inner"
                      placeholder="Nhập nội dung văn bản..."
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <button 
                      onClick={() => handleProcess('encrypt')} 
                      disabled={isEncrypting || !inputText} 
                      className="w-full h-[80px] rounded-[2rem] font-black text-lg md:text-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/30 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 uppercase tracking-widest flex items-center justify-center gap-3"
                    >
                      {isEncrypting ? (
                        <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ĐANG XỬ LÝ...</>
                      ) : '🔒 BẮT ĐẦU MÃ HÓA'}
                    </button>
                  </div>
                </div>

                {encryptResult && (
                  <div className="mt-10 bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                      <p className="text-[11px] text-indigo-400 font-black uppercase tracking-[0.2em] flex items-center gap-2"><span className="w-2 h-2 bg-indigo-400 rounded-full"></span> BẢN MÃ HEXADECIMAL (OUTPUT)</p>
                      {encryptTime > 0 && (
                        <span className="text-[10px] bg-indigo-500/20 border border-indigo-500/50 text-indigo-200 px-4 py-1.5 rounded-full font-black animate-in zoom-in">
                          ⚡ {encryptTime} ms
                        </span>
                      )}
                    </div>
                    <div className="bg-black/50 p-6 rounded-2xl border border-white/5 relative z-10">
                      <code className="text-base md:text-lg text-sky-300 font-mono break-all leading-relaxed">{encryptResult}</code>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-4 relative z-10">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(encryptResult);
                          setHexInput(encryptResult);
                          setActiveTab('decrypt');
                        }} 
                        className="text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl uppercase font-black tracking-widest shadow-lg flex items-center gap-2 transition-colors"
                      >
                       <span>📋</span> Sao chép & Giải mã ngay
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* MÔ PHỎNG TIMELINE */}
              <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-[800px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <h3 className="text-[11px] md:text-sm font-black text-indigo-900 uppercase tracking-widest">Phân tích vòng lặp 3DES</h3>
                  </div>
                  {encryptTime > 0 && <span className="text-[10px] font-black text-indigo-600 bg-white px-4 py-2 rounded-xl shadow-sm">Hoàn thành trong: {encryptTime} ms</span>}
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 md:pr-4 space-y-3 custom-scrollbar">
                  {encryptSteps.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                      <div className="text-6xl mb-4">🔍</div>
                      <p className="text-sm font-black uppercase tracking-widest">Ký hiệu trống - Đợi xử lý</p>
                    </div>
                  ) : (
                    encryptSteps.map((step, idx) => (
                      <div key={idx}>
                        {(idx === 0 || encryptSteps[idx - 1].blockIdx !== step.blockIdx) && (
                          <div className="sticky top-0 z-40 py-3 mb-4 bg-white/95 backdrop-blur border-b border-indigo-100 text-indigo-900 font-black text-[10px] uppercase tracking-widest shadow-sm">
                            --- Dữ liệu Khối #{step.blockIdx + 1} ---
                          </div>
                        )}
                        <StepItem step={step} index={idx} showExplainer={false} bitsToHex={bitsToHex} bitsToText={bitsToText} bitsToASCIIText={bitsToASCIIText} />
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}


          {/* GIẢI MÃ 3DES */}
          {activeTab === 'decrypt' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-emerald-900/5 border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-emerald-100 text-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl">2</div>
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Quy trình Giải mã (Decryption)</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Bản mã Hexadecimal</label>
                    <textarea
                      rows="5"
                      value={hexInput}
                      onChange={(e) => setHexInput(e.target.value)}
                      className="w-full px-6 py-6 rounded-[2rem] bg-emerald-50/50 border border-emerald-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-sm md:text-base text-slate-700 resize-none shadow-inner"
                      placeholder="Dán chuỗi Hex vào đây để giải mã..."
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <button 
                      onClick={() => handleProcess('decrypt')} 
                      disabled={isDecrypting || !hexInput} 
                      className="w-full h-[80px] rounded-[2rem] font-black text-lg md:text-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/30 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 uppercase tracking-widest flex items-center justify-center gap-3"
                    >
                      {isDecrypting ? (
                         <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> KHÔI PHỤC...</>
                      ) : '🔓 GIẢI MÃ'}
                    </button>
                  </div>
                </div>

                {decryptResult && (
                  <div className="mt-10 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-[2rem] border border-emerald-200 shadow-xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                      <p className="text-[11px] text-emerald-600 font-black uppercase tracking-[0.2em] flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> KẾT QUẢ KHÔI PHỤC (TEXT)</p>
                      {decryptTime > 0 && (
                        <span className="text-[10px] bg-emerald-500 text-white px-4 py-1.5 rounded-full font-black shadow-md shadow-emerald-500/20 animate-in zoom-in">
                          ⚡ {decryptTime} ms
                        </span>
                      )}
                    </div>
                    <div className="bg-white/80 backdrop-blur p-8 rounded-2xl border border-emerald-100 shadow-sm relative z-10">
                      <p className="text-2xl md:text-3xl text-emerald-950 font-black italic select-all leading-tight">"{decryptResult}"</p>
                    </div>
                  </div>
                )}
              </div>

              {/* MÔ PHỎNG TIMELINE */}
              <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col h-[800px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    </div>
                    <h3 className="text-[11px] md:text-sm font-black text-emerald-900 uppercase tracking-widest">Phân tích khôi phục & Giải mã (Unicode)</h3>
                  </div>
                  {decryptTime > 0 && <span className="text-[10px] font-black text-emerald-600 bg-white px-4 py-2 rounded-xl shadow-sm">Hoàn thành trong: {decryptTime} ms</span>}
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 md:pr-4 space-y-3 custom-scrollbar">
                  {decryptSteps.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                      <div className="text-6xl mb-4">⏳</div>
                      <p className="text-sm font-black uppercase tracking-widest">Hệ thống đang chờ lệnh</p>
                    </div>
                  ) : (
                    decryptSteps.map((step, idx) => (
                      <div key={idx}>
                        {(idx === 0 || decryptSteps[idx - 1].blockIdx !== step.blockIdx) && (
                          <div className="sticky top-0 z-40 py-3 mb-4 bg-white/95 backdrop-blur border-b border-emerald-100 text-emerald-900 font-black text-[10px] uppercase tracking-widest shadow-sm">
                            --- Dữ liệu Khối #{step.blockIdx + 1} ---
                          </div>
                        )}
                        <StepItem step={step} index={idx} showExplainer={true} bitsToHex={bitsToHex} bitsToText={bitsToText} bitsToASCIIText={bitsToASCIIText} />
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}


          {/* ĐÁNH GIÁ AES */}
          {activeTab === 'aes' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="bg-slate-900 p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-indigo-500/10 border border-slate-800 relative overflow-hidden">
                {/* Glow Effects */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 border-b border-white/10 pb-8">
                  <div className="flex items-center gap-5">
                    <div className="bg-gradient-to-br from-indigo-500 to-sky-500 text-white w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/30 ring-4 ring-slate-800">
                      AES
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Advanced Encryption Standard</h2>
                      <p className="text-indigo-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mt-2">Đo lường Benchmark bằng CryptoJS</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="bg-slate-800 text-slate-300 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-slate-700">AES-256</span>
                     <span className="bg-slate-800 text-slate-300 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-slate-700">ECB Mode</span>
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-3 space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Dữ liệu kiểm thử (Từ giao diện 3DES)</label>
                    <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 text-slate-300 text-lg md:text-xl font-medium flex items-center italic min-h-[100px]">
                      "{inputText || 'Vui lòng nhập văn bản ở tab Mã hóa'}"
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-end">
                    <button 
                      onClick={handleAESProcess} 
                      disabled={isAesEncrypting || !inputText} 
                      className="w-full h-20 rounded-[2rem] font-black text-lg text-white bg-white/10 hover:bg-white hover:text-indigo-900 border border-white/20 hover:border-white transition-all shadow-xl active:scale-95 disabled:opacity-20 uppercase tracking-widest backdrop-blur-sm"
                    >
                      {isAesEncrypting ? 'ĐANG ĐO LƯỜNG...' : '⚡ CHẠY BENCHMARK'}
                    </button>
                  </div>
                </div>

                {aesResult && (
                  <div className="mt-12 relative z-10 animate-in zoom-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                      <p className="text-[11px] text-sky-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 bg-sky-400 rounded-full"></span>
                        KẾT QUẢ MÃ HÓA (BASE64)
                      </p>
                      {aesTime > 0 && (
                        <div className="bg-indigo-500 text-white px-5 py-2 rounded-xl font-black text-sm md:text-base border border-indigo-400 shadow-lg shadow-indigo-500/30">
                          ⏱ {aesTime.toFixed(4)} ms
                        </div>
                      )}
                    </div>
                    <code className="block bg-black/60 p-8 rounded-3xl text-indigo-200 text-base md:text-lg break-all border border-white/10 leading-relaxed font-mono shadow-inner">
                      {aesResult}
                    </code>
                    
                    {/* Tỉ lệ so sánh trực quan */}
                    {encryptTime > 0 && aesTime > 0 && (
                       <div className="mt-8 bg-indigo-950/50 p-6 rounded-2xl border border-indigo-500/20">
                          <p className="text-[10px] uppercase text-indigo-300 font-black mb-4">So sánh hiệu năng thực tế</p>
                          <div className="space-y-4">
                             <div>
                               <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                                 <span>Custom 3DES Algorithm</span>
                                 <span>{encryptTime} ms</span>
                               </div>
                               <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-slate-500 rounded-full" style={{ width: '100%' }}></div>
                               </div>
                             </div>
                             <div>
                               <div className="flex justify-between text-xs font-bold text-sky-400 mb-1">
                                 <span>CryptoJS Library (Native Optimized)</span>
                                 <span>{aesTime.toFixed(4)} ms</span>
                               </div>
                               <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative">
                                  <div className="h-full bg-sky-400 rounded-full absolute top-0 left-0 shadow-[0_0_10px_#38bdf8]" style={{ width: `${Math.min((aesTime / encryptTime) * 100, 100)}%`, minWidth: '4px' }}></div>
                               </div>
                             </div>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium italic mt-4 text-center">Lưu ý: 3DES implementation đang đo lường cùng với mô phỏng lấy dữ liệu log cho từng khối nên tốc độ chậm hơn so với thư viện native C++ / WebAssembly.</p>
                       </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default App
