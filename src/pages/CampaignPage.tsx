import React, { useState, useEffect, useRef } from 'react';
import { db, Logo } from '../services/firebase';
import { collection, query, where, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Download, Share2, Zap, Layout, 
  CheckCircle2, Loader2, Sparkles, Camera, 
  ArrowRight, ChevronLeft, ChevronRight, 
  Instagram, Facebook, Twitter, Globe
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Stage, Layer, Image as KonvaImage, Rect, Circle, Text, Group } from 'react-konva';
import useImage from 'use-image';

export default function CampaignPage({ slug }: { slug: string }) {
  const [candidate, setCandidate] = useState<any>(null);
  const [layouts, setLayouts] = useState<any[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<any>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const stageRef = useRef<any>(null);

  useEffect(() => {
    const fetchCandidate = async () => {
      const q = query(collection(db, 'candidates'), where('slug', '==', slug), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const candData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setCandidate(candData);
        
        // Fetch layouts
        const layoutsQuery = query(collection(db, `candidates/${candData.id}/layouts`));
        onSnapshot(layoutsQuery, (lSnap) => {
          const lData = lSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setLayouts(lData);
          if (lData.length > 0) setSelectedLayout(lData[0]);
        });
      }
      setLoading(false);
    };
    fetchCandidate();
  }, [slug]);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      setUserPhoto(reader.result as string);
      setProcessedImage(null);
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    multiple: false 
  });

  const handleProcess = async () => {
    if (!userPhoto || !selectedLayout) return;
    setIsProcessing(true);
    try {
      const response = await fetch('/api/python/api/process-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_image: userPhoto,
          layout_image: selectedLayout.imageUrl,
          tenant_id: candidate.id
        })
      });
      
      if (!response.ok) throw new Error('Falha no processamento da imagem');
      
      const data = await response.json();
      setProcessedImage(data.processed_image);
    } catch (error) {
      console.error('Processing error:', error);
      // Fallback to client-side processing if backend fails
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      setProcessedImage(dataUrl);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    if (!processedImage) return;
    try {
      const blob = await (await fetch(processedImage)).blob();
      const file = new File([blob], `apoio-${candidate.slug}.png`, { type: 'image/png' });
      
      if (navigator.share) {
        await navigator.share({
          title: `Eu apoio ${candidate.name}!`,
          text: `Gerei minha foto de apoio para a campanha de ${candidate.name}. Faça a sua também!`,
          files: [file],
          url: window.location.href
        });
      } else {
        // Fallback for browsers that don't support navigator.share with files
        alert('Seu navegador não suporta compartilhamento direto de arquivos. Por favor, baixe a imagem e compartilhe manualmente.');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const copyCampaignLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link da campanha copiado!');
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-emerald-500"><Zap className="animate-pulse" size={48} /></div>;
  if (!candidate) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white text-2xl font-bold">Candidato não encontrado.</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo className="w-10 h-10" />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight leading-none">{candidate.name}</span>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Campanha Oficial</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-400">
            <a href="#" className="hover:text-white transition-all">Propostas</a>
            <a href="#" className="hover:text-white transition-all">Agenda</a>
            <a href="#" className="hover:text-white transition-all">Contato</a>
          </div>
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2 rounded-full text-sm font-bold transition-all">
            Apoiar Candidato
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-2 gap-16">
        {/* Left: Info & Selection */}
        <div className="space-y-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-6xl font-bold leading-[1.1] mb-6">
              Mostre seu apoio à <span className="text-emerald-500 italic">vitória!</span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-xl">
              Escolha uma moldura, coloque sua foto e compartilhe nas redes sociais. Juntos somos mais fortes!
            </p>
          </motion.div>

          {/* Layout Selection */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Layout size={14} /> 1. Escolha sua moldura
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {layouts.map((layout) => (
                <button 
                  key={layout.id}
                  onClick={() => {
                    setSelectedLayout(layout);
                    setProcessedImage(null);
                  }}
                  className={`flex-shrink-0 w-32 aspect-square rounded-2xl overflow-hidden border-2 transition-all relative group ${selectedLayout?.id === layout.id ? 'border-emerald-500 scale-105 shadow-xl shadow-emerald-500/20' : 'border-white/10 hover:border-white/30'}`}
                >
                  <img src={layout.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {selectedLayout?.id === layout.id && (
                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="text-white" size={24} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Camera size={14} /> 2. Envie sua foto
            </h3>
            <div 
              {...getRootProps()} 
              className={`p-12 border-2 border-dashed rounded-[2.5rem] text-center transition-all cursor-pointer group ${isDragActive ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all">
                <Upload className="text-slate-400 group-hover:text-emerald-500" size={32} />
              </div>
              <p className="text-lg font-bold mb-2">Arraste sua foto aqui</p>
              <p className="text-slate-500 text-sm">Ou clique para selecionar do seu dispositivo</p>
            </div>
          </div>

          {/* Social Links */}
          <div className="pt-12 border-t border-white/5 flex items-center gap-8">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Siga o candidato:</p>
            <div className="flex gap-4">
              {[Instagram, Facebook, Twitter, Globe].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 hover:text-emerald-500 transition-all">
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Preview & Result */}
        <div className="relative">
          <div className="sticky top-32 space-y-8">
            <div className="aspect-square bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl relative group border border-white/5">
              {/* Konva Stage for Processing */}
              <div className="absolute inset-0 z-0">
                <Stage width={600} height={600} ref={stageRef}>
                  <Layer>
                    {userPhoto && <UserPhotoImage src={userPhoto} width={600} height={600} />}
                    {selectedLayout && <LayoutImage src={selectedLayout.imageUrl} width={600} height={600} />}
                  </Layer>
                </Stage>
              </div>

              {/* Overlay UI */}
              {!userPhoto && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-slate-900/50 backdrop-blur-sm">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mb-8">
                    <Sparkles className="text-emerald-500" size={40} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Prévia em Tempo Real</h3>
                  <p className="text-slate-400 leading-relaxed">Sua foto aparecerá aqui integrada com a moldura escolhida.</p>
                </div>
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
                  <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                  <p className="font-bold text-lg">Processando sua imagem...</p>
                </div>
              )}

              {processedImage && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-slate-950 z-30"
                >
                  <img src={processedImage} className="w-full h-full object-cover" />
                </motion.div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {!processedImage ? (
                <button 
                  onClick={handleProcess}
                  disabled={!userPhoto || isProcessing}
                  className="w-full py-5 bg-emerald-500 text-slate-950 rounded-[2rem] font-bold text-xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : <Zap size={24} />}
                  Gerar minha foto de apoio
                </button>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `campanha-${candidate.slug}.png`;
                      link.href = processedImage;
                      link.click();
                    }}
                    className="py-5 bg-emerald-500 text-slate-950 rounded-[2rem] font-bold text-xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                  >
                    <Download size={24} /> Baixar Foto
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={handleShare}
                      className="py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] font-bold text-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                    >
                      <Share2 size={24} /> Compartilhar
                    </button>
                    <button 
                      onClick={copyCampaignLink}
                      className="py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] font-bold text-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                    >
                      <ArrowRight size={24} /> Copiar Link
                    </button>
                  </div>
                </div>
              )}
              
              {processedImage && (
                <button 
                  onClick={() => setProcessedImage(null)}
                  className="text-slate-500 font-semibold hover:text-white transition-all text-sm"
                >
                  Tentar com outra foto ou moldura
                </button>
              )}
            </div>

            {/* AI Hint */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="text-emerald-500" size={20} />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                <span className="text-white font-bold">Dica da IA:</span> Fotos com fundo neutro e boa iluminação geram resultados 40% mais impactantes nas redes sociais.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const UserPhotoImage = ({ src, ...props }: any) => {
  const [image] = useImage(src);
  return <KonvaImage image={image} {...props} />;
};

const LayoutImage = ({ src, ...props }: any) => {
  const [image] = useImage(src, 'anonymous');
  return <KonvaImage image={image} {...props} />;
};
