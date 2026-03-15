export default function BattleCharacterSelector({ battleCharacters, characters, onOpenSelector }) {
  return (
    <div className="glass-strong rounded-3xl p-5 space-y-4 border border-indigo-500/20 shadow-xl shadow-indigo-950/20">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-200 flex items-center gap-2">
          <span className="bg-indigo-500/20 p-1.5 rounded-lg text-indigo-400">⚔️</span>
          バトル用キャラ (2体)
        </h3>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Selected</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((index) => {
          const charId = battleCharacters[index];
          const character = characters.find(c => c.id === charId);

          return (
            <button
              key={index}
              onClick={() => onOpenSelector(index)}
              className={`relative group aspect-square rounded-2xl flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300
                ${character 
                  ? 'border-indigo-500/50 bg-indigo-500/5 overflow-hidden' 
                  : 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-600'
                }`}
            >
              {character ? (
                <>
                  <img 
                    src={character.thumb} 
                    alt={character.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 text-left">
                    <p className="text-[9px] font-black text-white truncate drop-shadow-md">
                      {character.name}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-0.5">
                    <span className={`w-2 h-2 rounded-full shadow-sm 
                      ${character.attr === '赤' ? 'bg-red-500' : 
                        character.attr === '青' ? 'bg-blue-500' : 
                        character.attr === '緑' ? 'bg-green-500' : 
                        character.attr === '黒' ? 'bg-slate-900 border border-slate-700' : 
                        'bg-white'}`} 
                    />
                  </div>
                </>
              ) : (
                <div className="text-center group-hover:scale-110 transition-transform">
                  <p className="text-2xl mb-1 opacity-50 grayscale group-hover:grayscale-0 transition-all">＋</p>
                  <p className="text-[10px] font-bold text-slate-500">Slot {index + 1}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
