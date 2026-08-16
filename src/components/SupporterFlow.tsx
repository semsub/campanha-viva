import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon, 
  Download, 
  Share2, 
  CheckCircle2, 
  Zap,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import axios from 'axios';

export default function SupporterFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStep(2);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    try {
      const response = await axios.post('/api/processar-inteligente', formData, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data);
      setProcessedUrl(url);
      setStep(3);
    } catch (error) {
      console.error("Erro no processamento:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12">
      {/* Progress Stepper */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all ${
              step >= s ? "bg-brand-500 text-white shadow-[0_0_20px_rgba(0,0,128,0.4)]" : "bg-white/5 text-slate-600"
            }`}>
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            {s < 3 && <div className={`h-1 w-12 rounded-full transition-all ${step > s ? "bg-brand-500" : "bg-white/5"}`} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8"
          >
            <div className="space-y-4">
              <h3 className="text-5xl font-black uppercase tracking-tighter font-serif">Apoie seu <span className="text-brand-gold">Candidato</span></h3>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">Envie sua melhor foto e nossa IA de luxo criará sua arte de apoio personalizada em segundos.</p>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group relative bg-[#0A0A0A] border-2 border-dashed border-white/10 rounded-[40px] p-20 hover:border-brand-500/50 transition-all cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-brand-500/10 rounded-3xl flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform">
                  <Upload className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-black uppercase tracking-tight">Arraste ou clique para enviar</p>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">PNG, JPG ou JPEG (Máx. 10MB)</p>
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
            </div>

            <div className="flex items-center justify-center gap-12 pt-8">
              <div className="flex items-center gap-3 text-slate-500">
                <ShieldCheck className="w-5 h-5 text-brand-gold" />
                <span className="text-xs font-black uppercase tracking-widest">Seguro & Privado</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <Zap className="w-5 h-5 text-brand-gold" />
                <span className="text-xs font-black uppercase tracking-widest">Processamento Ultra Rápido</span>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="aspect-square bg-[#0A0A0A] rounded-[40px] overflow-hidden border border-white/5 shadow-2xl relative">
              <img src={previewUrl!} className="w-full h-full object-cover" alt="Preview" />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6">
                  <div className="w-20 h-20 border-4 border-brand-500 border-t-transparent rounded-full animate-spin shadow-[0_0_40px_rgba(0,0,128,0.5)]" />
                  <div className="text-center space-y-2">
                    <p className="text-xl font-black uppercase tracking-tighter text-brand-gold animate-pulse">IA Processando...</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Otimizando iluminação e enquadramento</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500/10 rounded-full text-brand-500 border border-brand-500/20">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Otimização Inteligente Ativa</span>
                </div>
                <h4 className="text-4xl font-black uppercase tracking-tighter font-serif leading-tight">Quase <span className="text-brand-gold">Pronto!</span></h4>
                <p className="text-slate-400 leading-relaxed">Nossa IA vai ajustar automaticamente sua foto para o melhor enquadramento e aplicar a moldura oficial de luxo com a logomarca, frase de apoio e o selo "Eu tô fechado com ele".</p>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="w-full bg-brand-500 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-lg shadow-[0_0_40px_rgba(0,0,128,0.4)] border border-brand-gold/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  Gerar Arte de Luxo
                  <ArrowRight className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setStep(1)}
                  className="w-full py-4 text-slate-500 font-black uppercase tracking-widest text-xs hover:text-white transition-colors"
                >
                  Escolher outra foto
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-12"
          >
            <div className="space-y-4">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-5xl font-black uppercase tracking-tighter font-serif">Arte <span className="text-brand-gold">Finalizada!</span></h3>
              <p className="text-slate-400">Sua foto de apoio está pronta para ser compartilhada com o mundo.</p>
            </div>

            <div className="max-w-xl mx-auto aspect-square bg-[#0A0A0A] rounded-[40px] overflow-hidden border border-brand-gold/20 shadow-[0_0_60px_rgba(212,175,55,0.1)] relative group">
              <img src={processedUrl!} className="w-full h-full object-cover" alt="Final" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                <a 
                  href={processedUrl!} 
                  download="campanha-viva.png"
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform"
                >
                  <Download className="w-6 h-6" />
                </a>
                <button className="w-16 h-16 bg-brand-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a 
                href={processedUrl!} 
                download="campanha-viva.png"
                className="w-full sm:w-auto bg-white text-black px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-5 h-5" />
                Baixar em HD
              </a>
              <button className="w-full sm:w-auto bg-brand-500 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_0_40px_rgba(0,0,128,0.4)] border border-brand-gold/50 hover:scale-105 transition-all flex items-center justify-center gap-3">
                <Share2 className="w-5 h-5" />
                Compartilhar
              </button>
            </div>

            <button 
              onClick={() => setStep(1)}
              className="text-slate-500 font-black uppercase tracking-widest text-xs hover:text-white transition-colors"
            >
              Gerar outra arte
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
