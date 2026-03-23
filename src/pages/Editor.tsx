import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Rect, Circle, Group, Transformer } from 'react-konva';
import useImage from 'use-image';
import { db, auth } from '../services/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Trash2, Layers, Type, Image as ImageIcon, 
  Square, Circle as CircleIcon, Move, Maximize, 
  RotateCcw, Download, ChevronLeft, Zap, Sparkles, 
  Loader2, Check, AlertCircle, Palette, MousePointer2
} from 'lucide-react';

const URL_CANDIDATE_ID = new URLSearchParams(window.location.search).get('candidateId');

export default function Editor({ user }: { user: any }) {
  const [elements, setElements] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [layoutName, setLayoutName] = useState('Novo Layout');
  const [candidate, setCandidate] = useState<any>(null);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useEffect(() => {
    if (!URL_CANDIDATE_ID) return;
    const fetchCandidate = async () => {
      const snap = await getDoc(doc(db, 'candidates', URL_CANDIDATE_ID));
      if (snap.exists()) setCandidate({ id: snap.id, ...snap.data() });
    };
    fetchCandidate();
  }, []);

  const addElement = (type: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newElement = {
      id,
      type,
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      fill: type === 'text' ? '#ffffff' : '#10b981',
      text: type === 'text' ? 'Seu Texto Aqui' : '',
      fontSize: 40,
      fontFamily: 'Inter',
      rotation: 0,
      draggable: true,
      opacity: 1,
      zIndex: elements.length
    };
    setElements([...elements, newElement]);
    setSelectedId(id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const id = Math.random().toString(36).substr(2, 9);
      setElements([...elements, {
        id,
        type: 'image',
        src: reader.result as string,
        x: 50,
        y: 50,
        width: 400,
        height: 400,
        draggable: true,
        zIndex: elements.length
      }]);
      setSelectedId(id);
    };
    reader.readAsDataURL(file);
  };

  const updateElement = (id: string, newProps: any) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...newProps } : el));
  };

  const handleSave = async () => {
    if (!URL_CANDIDATE_ID) return;
    setIsSaving(true);
    try {
      // Deselect before saving to avoid transformer in screenshot
      setSelectedId(null);
      
      // Small delay to ensure UI updates
      setTimeout(async () => {
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 3 }); // High quality
        await addDoc(collection(db, `candidates/${URL_CANDIDATE_ID}/layouts`), {
          name: layoutName,
          imageUrl: dataUrl,
          config: elements,
          candidateId: URL_CANDIDATE_ID,
          isPublic: true,
          createdAt: new Date().toISOString()
        });
        window.location.href = '/dashboard';
      }, 200);
    } catch (error) {
      console.error('Error saving layout:', error);
      setIsSaving(false);
    }
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const selectedNode = stageRef.current.findOne('#' + selectedId);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId, elements]);

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-80 border-r border-white/5 flex flex-col bg-slate-950/50 backdrop-blur-xl z-20 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center gap-4">
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="p-2 hover:bg-white/5 rounded-xl transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <input 
            className="bg-transparent font-bold text-lg focus:outline-none flex-1 border-b border-transparent focus:border-emerald-500 transition-all"
            value={layoutName}
            onChange={e => setLayoutName(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {/* Tools */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Ferramentas</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Type, label: 'Texto', action: () => addElement('text') },
                { icon: Square, label: 'Retângulo', action: () => addElement('rect') },
                { icon: CircleIcon, label: 'Círculo', action: () => addElement('circle') },
                { icon: ImageIcon, label: 'Imagem', action: () => document.getElementById('img-upload')?.click() }
              ].map((tool, i) => (
                <button 
                  key={i}
                  onClick={tool.action}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex flex-col items-center gap-2 group"
                >
                  <tool.icon size={24} className="group-hover:text-emerald-500 transition-all" />
                  <span className="text-xs font-semibold">{tool.label}</span>
                </button>
              ))}
              <input type="file" id="img-upload" hidden accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>

          {/* Properties Editor */}
          <AnimatePresence mode="wait">
            {selectedElement && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Propriedades</h3>
                  <button onClick={() => setSelectedId(null)} className="text-slate-500 hover:text-white"><Check size={16} /></button>
                </div>

                {selectedElement.type === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">Conteúdo</label>
                      <textarea 
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 h-20 resize-none"
                        value={selectedElement.text}
                        onChange={e => updateElement(selectedId!, { text: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">Tamanho da Fonte</label>
                      <input 
                        type="range" min="10" max="200"
                        className="w-full accent-emerald-500"
                        value={selectedElement.fontSize}
                        onChange={e => updateElement(selectedId!, { fontSize: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                )}

                {(selectedElement.type === 'rect' || selectedElement.type === 'circle' || selectedElement.type === 'text') && (
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">Cor</label>
                    <div className="flex flex-wrap gap-2">
                      {['#ffffff', '#000000', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                        <button 
                          key={color}
                          onClick={() => updateElement(selectedId!, { fill: color })}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${selectedElement.fill === color ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-2">Opacidade</label>
                  <input 
                    type="range" min="0" max="1" step="0.1"
                    className="w-full accent-emerald-500"
                    value={selectedElement.opacity}
                    onChange={e => updateElement(selectedId!, { opacity: parseFloat(e.target.value) })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Creative */}
          <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <Sparkles className="text-emerald-500 animate-pulse" size={20} />
            </div>
            <h3 className="text-sm font-bold mb-2">IA Criativa</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">Deixe nossa IA sugerir elementos e cores baseados no seu perfil.</p>
            <button className="w-full py-2 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-emerald-400 transition-all">
              Gerar Sugestões
            </button>
          </div>

          {/* Layers */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Camadas</h3>
            <div className="space-y-2">
              {elements.slice().reverse().map((el, i) => (
                <div 
                  key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between group cursor-pointer transition-all ${selectedId === el.id ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-3">
                    <Layers size={16} />
                    <span className="text-xs font-bold truncate max-w-[120px]">
                      {el.type === 'text' ? el.text : `${el.type} ${el.id.substr(0, 4)}`}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setElements(elements.filter(item => item.id !== el.id));
                      setSelectedId(null);
                    }}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg text-red-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 bg-emerald-500 text-slate-950 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Salvar Layout
          </button>
        </div>
      </aside>

      {/* Editor Canvas */}
      <main className="flex-1 bg-slate-900 relative flex items-center justify-center overflow-hidden">
        {/* Toolbar */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl z-10">
          <div className="flex items-center gap-2 border-r border-white/10 pr-6">
            <button className="p-2 hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-white"><MousePointer2 size={20} /></button>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-white"><Move size={20} /></button>
          </div>
          <div className="flex items-center gap-2 border-r border-white/10 pr-6">
            <button className="p-2 hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-white"><RotateCcw size={20} /></button>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-white"><Maximize size={20} /></button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white/20 cursor-pointer" />
            <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white/20 cursor-pointer" />
            <div className="w-8 h-8 rounded-full bg-white border-2 border-white/20 cursor-pointer" />
          </div>
        </div>

        <div className="shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-white rounded-lg overflow-hidden">
          <Stage 
            width={800} 
            height={800} 
            ref={stageRef}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) {
                setSelectedId(null);
              }
            }}
          >
            <Layer>
              {elements.map((el) => {
                const commonProps = {
                  key: el.id,
                  id: el.id,
                  ...el,
                  onDragEnd: (e: any) => {
                    updateElement(el.id, { x: e.target.x(), y: e.target.y() });
                  },
                  onTransformEnd: (e: any) => {
                    const node = e.target;
                    updateElement(el.id, {
                      x: node.x(),
                      y: node.y(),
                      width: Math.max(5, node.width() * node.scaleX()),
                      height: Math.max(5, node.height() * node.scaleY()),
                      rotation: node.rotation(),
                      scaleX: 1,
                      scaleY: 1
                    });
                  },
                  onClick: () => setSelectedId(el.id)
                };

                if (el.type === 'text') return <Text {...commonProps} />;
                if (el.type === 'rect') return <Rect {...commonProps} />;
                if (el.type === 'circle') return <Circle {...commonProps} />;
                if (el.type === 'image') return <URLImage {...commonProps} />;
                return null;
              })}
              <Transformer 
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 5 || newBox.height < 5) return oldBox;
                  return newBox;
                }}
              />
            </Layer>
          </Stage>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-8 right-8 bg-slate-950/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex flex-col gap-2 shadow-2xl">
          <button className="p-3 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white font-bold">+</button>
          <div className="text-[10px] font-bold text-center text-slate-500">100%</div>
          <button className="p-3 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white font-bold">-</button>
        </div>
      </main>
    </div>
  );
}

const URLImage = ({ src, ...props }: any) => {
  const [image] = useImage(src);
  return <KonvaImage image={image} {...props} />;
};
