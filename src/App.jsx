import { useState, useEffect, useRef } from 'react'
// Import các hàm mã hóa từ file encryption.js và giải mã từ decode.js
import { encrypt3DES, bitsToHex } from './utils/encryption'
import { decrypt3DES } from './utils/decode'
import CryptoJS from 'crypto-js'
import './App.css'

// Cách 1: Đọc từng byte một (ASCII) - Đây là lý do gây ra lỗi h··m nay
const bitsToASCIIText = (bitsArray) => {
  if (!bitsArray || bitsArray.length === 0) return "";
  let text = "";
  for (let i = 0; i < bitsArray.length; i += 8) {
    const byte = parseInt(bitsArray.slice(i, i + 8).join(''), 2);
    text += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '·';
  }
  // Nếu là chuỗi dài, chỉ lấy 8 ký tự cuối đại diện cho khối hiện tại (nhưng vẫn giữ logic byte đơn)
  return text.length > 8 ? text.slice(-8) : text;
}

// Cách 2: Sử dụng TextDecoder (UTF-8) - Đã sửa lỗi  bằng cách giải mã toàn chuỗi tích lũy
const bitsToText = (bitsArray) => {
  if (!bitsArray || bitsArray.length === 0) return "";
  try {
    const bytes = [];
    for (let i = 0; i < bitsArray.length; i += 8) {
      bytes.push(parseInt(bitsArray.slice(i, i + 8).join(''), 2));
    }
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const fullText = decoder.decode(new Uint8Array(bytes));
    
    // Để hiển thị trong Timeline, chúng ta lấy phần văn bản tương ứng với khối hiện tại
    // Cách tốt nhất là hiển thị chuỗi tích lũy để người dùng thấy văn bản đang được 'xây dựng'
    return fullText;
  } catch (e) {
    return "········";
  }
}

function App() {
  // State quản lý dữ liệu chung
  const [inputText, setInputText] = useState('Hello xin chào')
  const [hexInput, setHexInput] = useState('')
  const [key, setKey] = useState('0123456789ABCDEFFEDCBA98765432100123456789ABCDEF')
  const [encryptResult, setEncryptResult] = useState('')
  const [decryptResult, setDecryptResult] = useState('')
  
  // State quản lý Mã hóa
  const [encryptSteps, setEncryptSteps] = useState([])
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [encryptTime, setEncryptTime] = useState(0)
  
  // State quản lý Giải mã
  const [decryptSteps, setDecryptSteps] = useState([])
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptTime, setDecryptTime] = useState(0)

  // State quản lý AES
  const [aesResult, setAesResult] = useState('')
  const [aesTime, setAesTime] = useState(0)
  const [isAesEncrypting, setIsAesEncrypting] = useState(false)

  // State cuộn tự động
  const encryptStepsEndRef = useRef(null)
  const decryptStepsEndRef = useRef(null)

  const scrollToBottom = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom(encryptStepsEndRef)
  }, [encryptSteps])

  useEffect(() => {
    scrollToBottom(decryptStepsEndRef)
  }, [decryptSteps])

  // Hàm xử lý chung cho cả Mã hóa và Giải mã
  const handleProcess = async (mode) => {
    const startTime = performance.now()
    const allSteps = []
    let cumulativeBits = [] // Lưu trữ các bit đã xử lý để giải mã Unicode chính xác
    
    if (mode === 'encrypt') {
      setIsEncrypting(true)
      setEncryptSteps([])
      setEncryptTime(0)
      setEncryptResult('')
      
      try {
        const res = encrypt3DES(inputText, key, (step, blockIdx) => {
          // Gắn thêm bit hiện tại vào mảng tích lũy để phục vụ giải mã text
          const currentTotal = (step.type.includes('3DES') || step.type === 'IP' || step.type === 'FP' || step.type === 'RES')
            ? [...cumulativeBits, ...(step.result || step.bits || step.L || step.R || [])]
            : cumulativeBits;

          allSteps.push({ ...step, blockIdx, cumulativeBitsAtStep: currentTotal })
          
          if (step.type === 'KẾT THÚC 3DES') {
            cumulativeBits = [...cumulativeBits, ...step.result]
          }
        })
        setEncryptResult(res)

        for (let i = 0; i < allSteps.length; i++) {
          setEncryptSteps(prev => [...prev, allSteps[i]])
          if (i % 8 === 0) await new Promise(r => setTimeout(r, 10)) 
        }
        setEncryptTime(Math.round(performance.now() - startTime))
      } catch (e) { alert("Lỗi Mã hóa!"); console.error(e); }
      finally { setIsEncrypting(false); }
      
    } else {
      setIsDecrypting(true)
      setDecryptSteps([])
      setDecryptTime(0)
      setDecryptResult('')

      try {
        const res = decrypt3DES(hexInput, key, (step, blockIdx) => {
          const currentTotal = (step.type.includes('3DES') || step.type === 'IP' || step.type === 'FP' || step.result)
            ? [...cumulativeBits, ...(step.result || step.bits || step.L || step.R || [])]
            : cumulativeBits;

          allSteps.push({ ...step, blockIdx, cumulativeBitsAtStep: currentTotal })

          if (step.type === 'KẾT THÚC 3DES') {
            cumulativeBits = [...cumulativeBits, ...step.result]
          }
        })
        setDecryptResult(res)

        for (let i = 0; i < allSteps.length; i++) {
          setDecryptSteps(prev => [...prev, allSteps[i]])
          if (i % 8 === 0) await new Promise(r => setTimeout(r, 10)) 
        }
        setDecryptTime(Math.round(performance.now() - startTime))
      } catch (e) { alert("Lỗi Giải mã!"); console.error(e); }
    }
  }

  // Hàm xử lý AES riêng biệt để so sánh tốc độ
  const handleAESProcess = () => {
    setIsAesEncrypting(true)
    setAesResult('')
    setAesTime(0)
    
    // Sử dụng setTimeout để UI không bị treo và có thể hiển thị trạng thái 'Loading'
    setTimeout(() => {
      const startTime = performance.now()
      try {
        // Mã hóa AES bằng thư viện crypto-js
        const ciphertext = CryptoJS.AES.encrypt(inputText, key).toString()
        const endTime = performance.now()
        
        setAesResult(ciphertext)
        setAesTime(endTime - startTime)
      } catch (e) {
        alert("Lỗi Mã hóa AES!")
        console.error(e)
      } finally {
        setIsAesEncrypting(false)
      }
    }, 50)
  }

  const renderStep = (step, index, showExplainer = false) => {
    const isHeader = step.type.includes('BẮT ĐẦU') || step.type.includes('KẾT THÚC')
    const parentColors = {
      'K1': 'border-l-blue-500 bg-blue-500',
      'K2': 'border-l-emerald-500 bg-emerald-500',
      'K3': 'border-l-amber-500 bg-amber-500'
    }

    return (
      <div 
        key={index} 
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

              {/* Sơ đồ 3 Bước chuyển đổi UTF-8 chỉ hiển thị ở phần GIẢI MÃ và bước HOÀN TẤT */}
              {showExplainer && (step.type.includes('KẾT THÚC') || step.type.includes('FP')) && (step.result || step.bits) && (
                <div className="flex flex-col gap-4 mt-2 w-full animate-in flip-in-x duration-700 delay-300">
                   <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-200 shadow-sm">
                      <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-amber-900 overflow-x-auto py-2">
                        
                        {/* Bước 1: Văn bản thô Lỗi */}
                        <div className="flex flex-col items-center">
                           <span className="text-[10px] font-black uppercase opacity-60 mb-2">1. Văn bản thô (Lỗi do cắt byte)</span>
                           <div className="px-5 py-3 rounded-2xl bg-white border-2 border-amber-200 font-bold text-lg text-slate-400">
                             "{bitsToASCIIText(step.cumulativeBitsAtStep || step.result)}"
                           </div>
                        </div>

                        <span className="text-2xl opacity-30 mt-4 md:mt-0 font-black">→</span>

                        {/* Bước 2: Công thức giải mã */}
                        <div className="flex flex-col items-center">
                           <span className="text-[10px] font-black uppercase opacity-60 mb-2">2. Xử lý qua Decoder</span>
                           <div className="px-5 py-3 rounded-2xl bg-slate-900 border-2 border-slate-800 font-mono text-[11px] text-amber-500 font-black">
                             TextDecoder('utf-8').decode(...)
                           </div>
                        </div>

                        <span className="text-2xl opacity-30 mt-4 md:mt-0 font-black">→</span>

                        {/* Bước 3: Văn bản hoàn thiện */}
                        <div className="flex flex-col items-center">
                           <span className="text-[10px] font-black uppercase opacity-60 mb-2">3. Kết quả (Tích lũy hoàn thiện)</span>
                           <div className="px-6 py-3 rounded-2xl bg-indigo-600 border-2 border-indigo-400 font-black text-xl text-white shadow-xl shadow-indigo-100 italic">
                             "{bitsToText(step.cumulativeBitsAtStep || step.result)}"
                           </div>
                        </div>

                      </div>
                      <p className="text-[10px] text-amber-600 font-black text-center mt-6 uppercase tracking-widest leading-relaxed">
                        Hệ thống đã tự động gộp các byte bị chia cắt để khôi phục Tiếng Việt chuẩn xác
                      </p>
                   </div>
                </div>
               )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <header className="text-center space-y-3 pb-4">
          <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter sm:text-6xl">
            3DES <span className="text-indigo-600">Lab Suite</span>
          </h1>
          <p className="text-slate-400 font-bold text-base tracking-wide italic">Hệ thống mô phỏng mật mã học Triple DES quy mô lớn</p>
        </header>

        <main className="space-y-14 pb-24">
          
          {/* Cấu hình khóa chung (Sticky) */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 sticky top-6 z-50 ring-12 ring-slate-50/70 backdrop-blur-xl bg-white/95">
             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <label className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping"></span>
                  Khóa chung mật mã (24 Bytes Hex)
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="px-6 py-4 rounded-2xl bg-slate-100 border-none focus:ring-4 focus:ring-indigo-200 transition-all font-mono text-base text-indigo-700 font-black lg:w-3/4 tracking-widest shadow-inner placeholder-indigo-300"
                />
             </div>
          </div>

          {/* I. CHƯƠNG TRÌNH MÃ HÓA */}
          <section className="space-y-8">
            <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-200 space-y-10 group">
              <div className="flex items-center gap-4 border-b-4 border-slate-50 pb-6">
                <span className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-200">I</span>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Quy trình Mã hóa (Encryption)</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Văn bản gốc cần bảo mật</label>
                  <textarea
                    rows="4"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full px-8 py-6 rounded-[2rem] bg-slate-50 border-none focus:ring-8 focus:ring-indigo-100 transition-all text-lg font-bold text-slate-700 resize-none shadow-inner leading-relaxed"
                    placeholder="Nhập nội dung vào đây..."
                  />
                </div>
                <div className="space-y-4 flex flex-col justify-end pb-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Thực thi hệ thống</label>
                  <button 
                    onClick={() => handleProcess('encrypt')}
                    disabled={isEncrypting}
                    className="flex-1 rounded-[2rem] font-black text-xl text-white bg-indigo-600 hover:bg-slate-900 transition-all shadow-2xl shadow-indigo-300 hover:-translate-y-2 active:scale-95 uppercase tracking-tighter"
                  >
                    {isEncrypting ? '⚡ Đang xử lý...' : '🔒 BẮT ĐẦU MÃ HÓA'}
                  </button>
                </div>
              </div>

              {encryptResult && (
                <div className="bg-slate-950 px-8 py-8 rounded-[3rem] animate-in fade-in zoom-in border-8 border-slate-900 group-hover:border-indigo-900/20 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-[0.4em]">BẢN MÃ HEXADECIMAL (OUTPUT)</p>
                    <button 
                      onClick={() => {navigator.clipboard.writeText(encryptResult); setHexInput(encryptResult)}}
                      className="text-xs bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-white hover:text-indigo-600 transition-all uppercase font-black tracking-widest shadow-lg"
                    >
                      Tự động chuyển tiếp ↓
                    </button>
                  </div>
                  <code className="text-lg text-sky-400 font-mono break-all leading-normal block bg-slate-900/50 p-6 rounded-2xl border border-slate-800 tracking-wider">
                    {encryptResult}
                  </code>
                </div>
              )}
            </div>

            {/* Timeline Mã hóa */}
            <div className={`bg-white p-10 rounded-[3.5rem] shadow-xl border border-slate-100 flex flex-col h-[700px] transition-all duration-700 ${encryptSteps.length ? 'opacity-100' : 'opacity-30 blur-[2px]'}`}>
               <div className="flex justify-between items-center mb-8 bg-indigo-50 p-6 rounded-[2rem] border-2 border-indigo-100 shadow-sm">
                 <h3 className="text-sm font-black text-indigo-900 uppercase tracking-[0.3em] flex items-center gap-4">
                   <span className="w-3 h-3 bg-indigo-600 rounded-full"></span>
                   PHÂN TÍCH MÔ PHỎNG MÃ HÓA (TIMELINE I)
                 </h3>
                 {encryptTime > 0 && <span className="text-xs font-black text-indigo-700 bg-white px-4 py-2 rounded-full border border-indigo-200">HOÀN TẤT: {encryptTime} ms</span>}
               </div>
               <div className="flex-1 overflow-y-auto pr-4 space-y-2 scrollbar-thin">
                  {encryptSteps.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 italic space-y-4">
                      <div className="text-6xl opacity-10">3DES</div>
                      <p className="text-sm font-black uppercase tracking-widest opacity-40">Chờ lệnh thực thi từ người dùng...</p>
                    </div>
                  ) : (
                    encryptSteps.map((step, idx) => {
                      const isNewBlock = idx === 0 || encryptSteps[idx - 1].blockIdx !== step.blockIdx;
                      return (
                        <div key={idx} className="animate-in slide-in-from-bottom-2 duration-300">
                          {isNewBlock && (
                            <div className="sticky top-0 z-40 py-4 bg-white/90 backdrop-blur-md shadow-sm rounded-[1.5rem] mb-4 px-8 flex justify-between items-center border border-slate-100 ring-4 ring-slate-50">
                                <span className="font-black text-sm text-slate-900 uppercase tracking-widest">PHÂN TÍCH DỮ LIỆU KHỐI #{step.blockIdx + 1}</span>
                                <span className="text-xs font-black text-indigo-600 uppercase">Process: Encrypt</span>
                            </div>
                          )}
                          {renderStep(step, idx, false)}
                        </div>
                      )
                    })
                  )}
                  <div ref={encryptStepsEndRef} />
               </div>
            </div>
          </section>

          {/* II. CHƯƠNG TRÌNH GIẢI MÃ */}
          <section className="space-y-8">
            <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-emerald-100 border-t-[16px] border-t-emerald-500 space-y-10 group">
              <div className="flex items-center gap-4 border-b-4 border-emerald-50 pb-6">
                <span className="bg-emerald-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-200">II</span>
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Quy trình Giải mã (Decryption)</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Chuỗi Hex cần giải mã ngược</label>
                  <textarea
                    rows="4"
                    value={hexInput}
                    onChange={(e) => setHexInput(e.target.value)}
                    className="w-full px-8 py-6 rounded-[2rem] bg-emerald-50/30 border-none focus:ring-8 focus:ring-emerald-100 transition-all font-mono text-base font-bold text-slate-800 resize-none shadow-inner leading-relaxed tracking-wider"
                    placeholder="Chưa có dữ liệu Hex..."
                  />
                </div>
                <div className="space-y-4 flex flex-col justify-end pb-1">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Khôi phục hệ thống</label>
                   <button 
                    onClick={() => handleProcess('decrypt')}
                    disabled={isDecrypting || !hexInput}
                    className="flex-1 rounded-[2rem] font-black text-xl text-white bg-emerald-600 hover:bg-slate-900 transition-all shadow-2xl shadow-emerald-300 hover:-translate-y-2 active:scale-95 uppercase tracking-tighter disabled:bg-slate-200 disabled:shadow-none"
                  >
                    {isDecrypting ? '🔄 Đang giải mã...' : '🔓 GIẢI MÃ VĂN BẢN'}
                  </button>
                </div>
              </div>

              {decryptResult && (
                <div className="bg-emerald-50 p-10 rounded-[3rem] border-4 border-emerald-200 animate-in fade-in slide-in-from-top-6 shadow-lg">
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                    KẾT QUẢ KHÔI PHỤC (TEXT RECOVERY)
                  </p>
                  <p className="text-3xl text-emerald-950 font-black italic leading-tight select-all">"{decryptResult}"</p>
                </div>
              )}
            </div>

            {/* Timeline Giải mã */}
            <div className={`bg-white p-10 rounded-[3.5rem] shadow-xl border border-emerald-50 flex flex-col h-[700px] transition-all duration-700 ${decryptSteps.length ? 'opacity-100' : 'opacity-30 blur-[2px]'}`}>
               <div className="flex justify-between items-center mb-8 bg-emerald-50 p-6 rounded-[2rem] border-2 border-emerald-100 shadow-sm">
                 <h3 className="text-sm font-black text-emerald-950 uppercase tracking-[0.3em] flex items-center gap-4">
                   <span className="w-3 h-3 bg-emerald-600 rounded-full"></span>
                   PHÂN TÍCH MÔ PHỎNG GIẢI MÃ (TIMELINE II)
                 </h3>
                 {decryptTime > 0 && <span className="text-xs font-black text-emerald-700 bg-white px-4 py-2 rounded-full border border-emerald-200">HOÀN TẤT: {decryptTime} ms</span>}
               </div>
               <div className="flex-1 overflow-y-auto pr-4 space-y-2 scrollbar-thin">
                  {decryptSteps.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 italic space-y-4 text-center">
                      <div className="text-6xl opacity-10">3DES-D</div>
                      <p className="text-sm font-black uppercase tracking-widest opacity-40">Hệ thống đang ở trạng thái chờ...</p>
                    </div>
                  ) : (
                    decryptSteps.map((step, idx) => {
                      const isNewBlock = idx === 0 || decryptSteps[idx - 1].blockIdx !== step.blockIdx;
                      return (
                        <div key={idx} className="animate-in slide-in-from-bottom-2 duration-300">
                          {isNewBlock && (
                            <div className="sticky top-0 z-40 py-4 bg-white/90 backdrop-blur-md shadow-sm rounded-[1.5rem] mb-4 px-8 flex justify-between items-center border border-slate-100 ring-4 ring-emerald-50">
                                <span className="font-black text-sm text-slate-900 uppercase tracking-widest">PHÂN TÍCH DỮ LIỆU KHỐI #{step.blockIdx + 1}</span>
                                <span className="text-xs font-black text-emerald-600 uppercase">Process: Decrypt</span>
                            </div>
                          )}
                          {renderStep(step, idx, true)}
                        </div>
                      )
                    })
                  )}
                  <div ref={decryptStepsEndRef} />
               </div>
            </div>
          </section>

          {/* III. AES (DÀNH CHO SO SÁNH HIỆU NĂNG) */}
          <section className="space-y-8 animate-in slide-in-from-bottom-10 duration-1000">
            <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl border-4 border-indigo-500/30 space-y-10 group overflow-hidden relative">
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full"></div>
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-sky-600/10 blur-[100px] rounded-full"></div>

              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-8 relative z-10">
                <div className="flex items-center gap-5">
                   <div className="bg-gradient-to-br from-indigo-500 to-sky-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-500/20 ring-4 ring-slate-800">
                     AES
                   </div>
                   <div>
                     <h2 className="text-3xl font-black text-white uppercase tracking-tight">Advanced Encryption Standard</h2>
                     <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mt-1">Sử dụng thư viện CryptoJS (Phòng thí nghiệm)</p>
                   </div>
                </div>
                {aesTime > 0 && (
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Thời gian thực thi</span>
                    <div className="bg-indigo-500 text-white px-6 py-2 rounded-2xl font-black text-lg shadow-lg border-2 border-indigo-400 animate-pulse">
                      {aesTime.toFixed(4)} <span className="text-xs opacity-70">ms</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
                <div className="lg:col-span-3 space-y-4">
                   <div className="flex justify-between items-center px-4">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Dữ liệu đầu vào (Input Source)</label>
                     <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full">{inputText.length} ký tự</span>
                   </div>
                   <div className="bg-slate-800/50 p-6 rounded-[2rem] border-2 border-slate-700 font-bold text-slate-300 italic min-h-[100px] flex items-center">
                     "{inputText || 'Chưa có dữ liệu...'}"
                   </div>
                </div>
                
                <div className="flex flex-col justify-end pb-1">
                   <button 
                    onClick={handleAESProcess}
                    disabled={isAesEncrypting || !inputText}
                    className="w-full h-full min-h-[80px] rounded-[2rem] font-black text-xl text-white bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-white hover:to-white hover:text-indigo-900 transition-all shadow-2xl shadow-indigo-500/20 hover:-translate-y-2 active:scale-95 uppercase tracking-tighter disabled:opacity-30 disabled:translate-y-0"
                   >
                    {isAesEncrypting ? (
                      <span className="flex items-center justify-center gap-3">
                         <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         Xử lý...
                      </span>
                    ) : '⚡ MÃ HÓA AES'}
                   </button>
                </div>
              </div>

              {aesResult && (
                <div className="bg-indigo-900/20 p-8 rounded-[3rem] border-2 border-indigo-500/20 animate-in zoom-in slide-in-from-top-4 duration-500 backdrop-blur-sm">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-2 h-2 rounded-full bg-sky-400"></div>
                      <p className="text-[10px] text-sky-400 font-black uppercase tracking-[0.4em]">KẾT QUẢ MÃ HÓA AES (Base64 URL Safe)</p>
                   </div>
                   <div className="relative group/result">
                      <code className="text-xl text-indigo-100 font-mono break-all leading-relaxed block bg-slate-950/80 p-8 rounded-3xl border-2 border-slate-800 group-hover/result:border-sky-500/50 transition-colors shadow-2xl">
                        {aesResult}
                      </code>
                      <button 
                        onClick={() => navigator.clipboard.writeText(aesResult)}
                        className="absolute top-4 right-4 bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-sky-500 hover:text-white transition-all border border-slate-700"
                      >
                        Sao chép
                      </button>
                   </div>
                   <div className="mt-8 flex flex-wrap gap-4">
                      <div className="bg-slate-950/50 px-5 py-3 rounded-2xl border border-slate-800">
                         <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Thuật toán</span>
                         <span className="text-sm font-black text-white">AES-256 (CBC)</span>
                      </div>
                      <div className="bg-slate-950/50 px-5 py-3 rounded-2xl border border-slate-800">
                         <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Chế độ</span>
                         <span className="text-sm font-black text-white">PKCS7 Padding</span>
                      </div>
                   </div>
                </div>
              )}
            </div>
          </section>
        </main>

        <footer className="text-center py-16 border-t-2 border-slate-100 opacity-50">
          <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em]">3DES Visual Suite Premium • Large Scale Lab Environment</p>
        </footer>
      </div>
    </div>
  )
}

export default App
