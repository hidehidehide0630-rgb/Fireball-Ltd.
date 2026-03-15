import { useState, useMemo } from 'react';

export default function CharacterSelectModal({ 
  isOpen, 
  onClose, 
  characters, 
  onSelect 
}) {
  const [keyword, setKeyword] = useState('');
  const [attr, setAttr] = useState('全て');
  const [style, setStyle] = useState('全て');

  const filtered = useMemo(() => {
    return characters.filter(c => {
      if (keyword && !c.name.includes(keyword)) return false;
      if (attr !== '全て' && c.attr !== attr) return false;
      if (style !== '全て' && c.style !== style) return false;
      return true;
    });
  }, [characters, keyword, attr, style]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <span className="text-indigo-400">⚔️</span> キャラクターを選択
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-800/30 border-b border-slate-800 flex flex-wrap gap-3">
          <input 
            type="text"
            placeholder="キャラ名で検索..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
          />
          <select 
            value={attr}
            onChange={(e) => setAttr(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none"
          >
            <option value="全て">全ての属性</option>
            <option value="赤">赤</option>
            <option value="青">青</option>
            <option value="緑">緑</option>
            <option value="黒">黒</option>
            <option value="白">白</option>
          </select>
          <select 
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none"
          >
            <option value="全て">全てのスタイル</option>
            <option value="アタッカー">アタッカー</option>
            <option value="ディフェンダー">ディフェンダー</option>
            <option value="ゲッター">ゲッター</option>
          </select>
        </div>

        {/* Character List */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-800 border-2 border-transparent hover:border-indigo-500 transition-all active:scale-95"
              >
                <img 
                  src={c.thumb} 
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                  <span className="text-[10px] text-white font-bold truncate w-full">{c.name}</span>
                </div>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-20 text-slate-500">
              一致するキャラクターがいません
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
