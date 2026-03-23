import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Transformer, Rect } from 'react-konva';
import useImage from 'use-image';
import { Trash2, MoveUp, MoveDown, Type, Image as ImageIcon, Download, Sparkles, Layers, MousePointer2, Layout, ShieldCheck, Award } from 'lucide-react';
import { cn } from '../lib/utils';

interface Element {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  fill?: string;
  fontFamily?: string;
  align?: 'left' | 'center' | 'right';
  src?: string;
  rotation?: number;
  zIndex: number;
}

interface EditorProps {
  initialImage?: string;
  onSave: (dataUrl: string) => void;
}

const Editor: React.FC<EditorProps> = ({ initialImage, onSave }) => {
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add initial image as an element if provided
  useEffect(() => {
    if (initialImage) {
      const id = 'bg-' + Math.random().toString(36).substr(2, 9);
      setElements([{
        id,
        type: 'image',
        src: initialImage,
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
        zIndex: 0,
        rotation: 0
      }]);
    }
  }, [initialImage]);

  const addText = () => {
    const id = 'text-' + Math.random().toString(36).substr(2, 9);
    const newElement: Element = {
      id,
      type: 'text',
      text: 'NOVO TEXTO',
      x: 540,
      y: 540,
      fontSize: 80,
      fill: '#D4AF37',
      fontFamily: 'Playfair Display',
      zIndex: elements.length,
      rotation: 0
    };
    setElements([...elements, newElement]);
    setSelectedId(id);
  };

  const addSupportPhrase = () => {
    const id = 'text-' + Math.random().toString(36).substr(2, 9);
    const newElement: Element = {
      id,
      type: 'text',
      text: 'A força de quem sabe governar e a vontade de fazer mais',
      x: 0,
      y: 950,
      width: 1080,
      fontSize: 52,
      fill: '#D4AF37',
      fontFamily: 'Playfair Display',
      align: 'center',
      zIndex: elements.length,
      rotation: 0
    };
    setElements([...elements, newElement]);
    setSelectedId(id);
  };

  const addLogo = () => {
    const id = 'logo-' + Math.random().toString(36).substr(2, 9);
    const logoSvg = `
      <svg width="400" height="200" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="60" font-family="Arial Black, sans-serif" font-size="80" fill="#000080" font-weight="900" stroke="black" stroke-width="1">PAULO</text>
        <text x="0" y="120" font-family="Arial Black, sans-serif" font-size="60" fill="#D4AF37" font-weight="900" letter-spacing="4" stroke="black" stroke-width="0.8">HENRIQUE</text>
        <text x="180" y="170" font-family="Brush Script MT, cursive" font-size="100" fill="#000080" stroke="black" stroke-width="0.8">Gomes</text>
      </svg>
    `;
    const newElement: Element = {
      id,
      type: 'image',
      src: `data:image/svg+xml;base64,${btoa(logoSvg)}`,
      x: 50,
      y: 100,
      width: 300,
      height: 150,
      zIndex: elements.length,
      rotation: 0
    };
    setElements([...elements, newElement]);
    setSelectedId(id);
  };

  const addFechadoBadge = () => {
    const id = 'badge-' + Math.random().toString(36).substr(2, 9);
    const badgeSvg = `
      <svg width="400" height="200" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <text x="200" y="60" font-family="Arial Black, sans-serif" font-size="60" fill="#32CD32" text-anchor="middle" font-weight="900">EU TÔ</text>
        <text x="200" y="125" font-family="Arial Black, sans-serif" font-size="70" fill="#000080" text-anchor="middle" font-weight="900" stroke="#808080" stroke-width="2">FECHADO</text>
        <text x="200" y="190" font-family="Arial Black, sans-serif" font-size="60" fill="#32CD32" text-anchor="middle" font-weight="900">COM ELE</text>
        <circle cx="360" cy="50" r="35" fill="#32CD32" />
        <path d="M345 50 L355 60 L375 40" stroke="white" stroke-width="8" fill="none" />
      </svg>
    `;
    const newElement: Element = {
      id,
      type: 'image',
      src: `data:image/svg+xml;base64,${btoa(badgeSvg)}`,
      x: 700,
      y: 50,
      width: 250,
      height: 125,
      zIndex: elements.length,
      rotation: 0
    };
    setElements([...elements, newElement]);
    setSelectedId(id);
  };

  const addLuxuryFrame = () => {
    const id = 'frame-' + Math.random().toString(36).substr(2, 9);
    const newElement: Element = {
      id,
      type: 'image',
      src: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#004a8f;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#002a54;stop-opacity:1" />
            </linearGradient>
            <mask id="circleMask">
              <rect width="1080" height="1080" fill="white" />
              <circle cx="540" cy="540" r="420" fill="black" />
            </mask>
          </defs>

          <!-- Background with hole -->
          <rect width="1080" height="1080" fill="url(#bgGradient)" mask="url(#circleMask)" />
          
          <!-- Map Texture (Simplified) -->
          <path d="M50 50 L200 50 L250 150 L100 200 Z" fill="white" opacity="0.05" transform="scale(2)" mask="url(#circleMask)" />

          <!-- Bottom Diagonal Stripes -->
          <g mask="url(#circleMask)">
            <path d="M0 800 L1080 600 L1080 1080 L0 1080 Z" fill="#003366" />
            <path d="M0 850 L1080 650 L1080 1080 L0 1080 Z" fill="#0055aa" />
            <path d="M0 900 L1080 700 L1080 1080 L0 1080 Z" fill="#ffaa00" />
            <path d="M0 950 L1080 750 L1080 1080 L0 1080 Z" fill="#003366" />
          </g>

          <!-- Badge (Top Right) -->
          <g transform="translate(720, 30) scale(0.8)">
            <text x="100" y="50" font-family="Arial Black" font-size="60" fill="#ccff00" stroke="black" stroke-width="1">EU TÔ</text>
            <text x="100" y="110" font-family="Arial Black" font-size="70" fill="white" stroke="black" stroke-width="2">FECHADO</text>
            <text x="100" y="170" font-family="Arial Black" font-size="60" fill="#ccff00" stroke="black" stroke-width="1">COM ELE</text>
            <circle cx="260" cy="50" r="40" fill="#00aa00" stroke="white" stroke-width="3" />
            <path d="M240 50 L255 65 L285 35" stroke="white" stroke-width="8" fill="none" />
          </g>

          <!-- Logo (Bottom) -->
          <g transform="translate(540, 850)" text-anchor="middle">
            <text y="0" font-family="Arial Black" font-size="160" fill="#000080" stroke="white" stroke-width="15" paint-order="stroke">PAULO</text>
            <text y="0" font-family="Arial Black" font-size="160" fill="#000080">PAULO</text>
            <text y="80" font-family="Arial Black" font-size="100" fill="#ffcc00" stroke="white" stroke-width="10" paint-order="stroke">HENRIQUE</text>
            <text y="80" font-family="Arial Black" font-size="100" fill="#ffcc00">HENRIQUE</text>
            <text x="150" y="140" font-family="Brush Script MT, cursive" font-size="180" fill="#000080" stroke="white" stroke-width="10" paint-order="stroke">Gomes</text>
            <text x="150" y="140" font-family="Brush Script MT, cursive" font-size="180" fill="#000080">Gomes</text>
          </g>

          <!-- Support Phrase -->
          <text x="540" y="1050" font-family="Playfair Display, serif" font-size="30" font-weight="900" fill="white" text-anchor="middle" letter-spacing="1" style="text-transform: uppercase; opacity: 0.8;">
            A força de quem sabe governar e a vontade de fazer mais
          </text>
        </svg>
      `),
      x: 0,
      y: 0,
      width: 1080,
      height: 1080,
      zIndex: elements.length,
      rotation: 0
    };
    setElements([...elements, newElement]);
    setSelectedId(id);
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const id = 'img-' + Math.random().toString(36).substr(2, 9);
        const newElement: Element = {
          id,
          type: 'image',
          src: event.target?.result as string,
          x: 540,
          y: 540,
          width: 400,
          height: 400,
          zIndex: elements.length,
          rotation: 0
        };
        setElements([...elements, newElement]);
        setSelectedId(id);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleDragEnd = (e: any, id: string) => {
    const updatedElements = elements.map(el => {
      if (el.id === id) {
        return { ...el, x: e.target.x(), y: e.target.y() };
      }
      return el;
    });
    setElements(updatedElements);
  };

  const handleTransformEnd = (e: any, id: string) => {
    const node = e.target;
    const updatedElements = elements.map(el => {
      if (el.id === id) {
        return {
          ...el,
          x: node.x(),
          y: node.y(),
          width: node.width() * node.scaleX(),
          height: node.height() * node.scaleY(),
          rotation: node.rotation()
        };
      }
      return el;
    });
    setElements(updatedElements);
    node.scaleX(1);
    node.scaleY(1);
  };

  const deleteElement = () => {
    if (selectedId) {
      setElements(elements.filter(el => el.id !== selectedId));
      setSelectedId(null);
    }
  };

  const moveLayer = (direction: 'up' | 'down') => {
    if (!selectedId) return;
    const index = elements.findIndex(el => el.id === selectedId);
    if (index === -1) return;

    const newElements = [...elements];
    if (direction === 'up' && index < elements.length - 1) {
      [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
    } else if (direction === 'down' && index > 0) {
      [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
    }
    setElements(newElements);
  };

  const handleExport = () => {
    setSelectedId(null);
    setTimeout(() => {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      onSave(dataUrl);
    }, 100);
  };

  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const selectedNode = stageRef.current.findOne('#' + selectedId);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#050505] text-white overflow-hidden">
      {/* Left Toolbar */}
      <div className="w-full lg:w-20 bg-[#0A0A0A] border-r border-white/5 flex flex-row lg:flex-col items-center py-4 gap-6 px-4 lg:px-0">
        <button onClick={addText} className="p-3 rounded-xl hover:bg-white/5 text-brand-gold transition-all" title="Adicionar Texto">
          <Type className="w-6 h-6" />
        </button>
        <button onClick={addSupportPhrase} className="p-3 rounded-xl hover:bg-white/5 text-brand-gold transition-all" title="Adicionar Frase de Apoio">
          <Sparkles className="w-6 h-6" />
        </button>
        <button onClick={addFechadoBadge} className="p-3 rounded-xl hover:bg-white/5 text-green-500 transition-all" title="Adicionar Selo 'Fechado com Ele'">
          <ShieldCheck className="w-6 h-6" />
        </button>
        <button onClick={addLuxuryFrame} className="p-3 rounded-xl hover:bg-white/5 text-brand-gold transition-all" title="Adicionar Moldura de Luxo">
          <Layout className="w-6 h-6" />
        </button>
        <button onClick={addLogo} className="p-3 rounded-xl hover:bg-white/5 text-brand-gold transition-all" title="Adicionar Logomarca Oficial">
          <Award className="w-6 h-6" />
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl hover:bg-white/5 text-slate-400 transition-all" title="Upload Imagem">
          <ImageIcon className="w-6 h-6" />
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
        </button>
        <div className="h-px w-10 bg-white/5 hidden lg:block" />
        <button onClick={() => moveLayer('up')} className="p-3 rounded-xl hover:bg-white/5 text-slate-400 transition-all" title="Trazer para Frente">
          <MoveUp className="w-6 h-6" />
        </button>
        <button onClick={() => moveLayer('down')} className="p-3 rounded-xl hover:bg-white/5 text-slate-400 transition-all" title="Enviar para Trás">
          <MoveDown className="w-6 h-6" />
        </button>
        <button onClick={deleteElement} className="p-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-all" title="Deletar">
          <Trash2 className="w-6 h-6" />
        </button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative flex items-center justify-center p-4 lg:p-12 bg-[#050505] overflow-auto">
        <div className="shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 bg-black rounded-lg overflow-hidden">
          <Stage
            width={1080}
            height={1080}
            scaleX={window.innerWidth < 1024 ? (window.innerWidth - 40) / 1080 : 0.55}
            scaleY={window.innerWidth < 1024 ? (window.innerWidth - 40) / 1080 : 0.55}
            ref={stageRef}
            onClick={(e) => {
              if (e.target === e.target.getStage()) {
                setSelectedId(null);
              }
            }}
          >
            <Layer>
              {elements.map((el) => {
                if (el.type === 'text') {
                  return (
                    <Text
                      key={el.id}
                      id={el.id}
                      text={el.text}
                      x={el.x}
                      y={el.y}
                      width={el.width}
                      align={el.align}
                      fontSize={el.fontSize}
                      fill={el.fill}
                      fontFamily={el.fontFamily}
                      shadowColor="black"
                      shadowBlur={10}
                      shadowOpacity={0.8}
                      draggable
                      onDragEnd={(e) => handleDragEnd(e, el.id)}
                      onClick={() => handleSelect(el.id)}
                      onTransformEnd={(e) => handleTransformEnd(e, el.id)}
                    />
                  );
                } else if (el.type === 'image' && el.src) {
                  return (
                    <URLImage
                      key={el.id}
                      id={el.id}
                      src={el.src}
                      x={el.x}
                      y={el.y}
                      width={el.width}
                      height={el.height}
                      draggable
                      onDragEnd={(e) => handleDragEnd(e, el.id)}
                      onClick={() => handleSelect(el.id)}
                      onTransformEnd={(e) => handleTransformEnd(e, el.id)}
                    />
                  );
                }
                return null;
              })}
              {selectedId && (
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 5 || newBox.height < 5) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Right Properties Panel */}
      <div className="w-full lg:w-80 bg-[#0A0A0A] border-l border-white/5 p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-brand-gold">Propriedades</h3>
          <Layers className="w-4 h-4 text-slate-500" />
        </div>

        {selectedId ? (
          <div className="space-y-6">
            {elements.find(el => el.id === selectedId)?.type === 'text' && (
              <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Conteúdo</label>
                    <textarea
                      value={elements.find(el => el.id === selectedId)?.text || ''}
                      onChange={(e) => {
                        setElements(elements.map(el => el.id === selectedId ? { ...el, text: e.target.value } : el));
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-brand-gold outline-none min-h-[80px] resize-none"
                    />
                  </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Fonte</label>
                  <select
                    value={elements.find(el => el.id === selectedId)?.fontFamily || 'Playfair Display'}
                    onChange={(e) => {
                      setElements(elements.map(el => el.id === selectedId ? { ...el, fontFamily: e.target.value } : el));
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-brand-gold outline-none"
                  >
                    <option value="Playfair Display">Playfair Display (Serif)</option>
                    <option value="Inter">Inter (Sans)</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Anton">Anton (Bold)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Cor</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={elements.find(el => el.id === selectedId)?.fill || '#ffffff'}
                      onChange={(e) => {
                        setElements(elements.map(el => el.id === selectedId ? { ...el, fill: e.target.value } : el));
                      }}
                      className="w-10 h-10 bg-transparent border-none cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400 uppercase">{elements.find(el => el.id === selectedId)?.fill || '#ffffff'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Tamanho</label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={elements.find(el => el.id === selectedId)?.fontSize || 60}
                    onChange={(e) => {
                      setElements(elements.map(el => el.id === selectedId ? { ...el, fontSize: parseInt(e.target.value) } : el));
                    }}
                    className="w-full accent-brand-gold"
                  />
                </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Cor</label>
                    <div className="grid grid-cols-5 gap-2">
                      {['#FFFFFF', '#D4AF37', '#000080', '#FF0000', '#00FF00', '#000000', '#C0C0C0', '#808080', '#F5F5DC', '#FFD700'].map(color => (
                        <button
                          key={color}
                          onClick={() => setElements(elements.map(el => el.id === selectedId ? { ...el, fill: color } : el))}
                          className={cn(
                            "w-8 h-8 rounded-full border border-white/10",
                            elements.find(el => el.id === selectedId)?.fill === color && "ring-2 ring-brand-gold"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
              </div>
            )}
            <div className="pt-6 border-t border-white/5">
              <button
                onClick={deleteElement}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all text-xs font-black uppercase tracking-widest"
              >
                <Trash2 className="w-4 h-4" />
                Remover Elemento
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <MousePointer2 className="w-8 h-8 text-slate-700" />
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Selecione um elemento<br/>para editar</p>
          </div>
        )}

        <div className="pt-8 border-t border-white/5">
          <button
            onClick={handleExport}
            className="w-full py-4 rounded-2xl bg-brand-500 text-white font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(0,0,128,0.4)] border border-brand-gold/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Download className="w-4 h-4" />
            Finalizar Arte
          </button>
        </div>
      </div>
    </div>
  );
};

const URLImage = ({ src, ...props }: any) => {
  const [img] = useImage(src);
  return <KonvaImage image={img} {...props} />;
};

export default Editor;
