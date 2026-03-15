import { useState, useEffect, useRef } from 'react';
import { useCharacters } from './hooks/useCharacters';
import { useTeamBuilder } from './hooks/useTeamBuilder';
import { useTagsData } from './hooks/useTagsData';
import { supabase } from './lib/supabaseClient';
import CharacterCard from './components/CharacterCard';
import FilterBar from './components/FilterBar';
import TeamPanel from './components/TeamPanel';
import Auth from './components/Auth';
import CharacterSelectModal from './components/CharacterSelectModal';

export default function App() {
  const [selectedAttr, setSelectedAttr] = useState('全て');
  const [selectedTags, setSelectedTags] = useState([]);
  const [activeTab, setActiveTab] = useState('team'); // 'team' or 'characters' (mobile only)
  const [battleCharacters, setBattleCharacters] = useState([null, null]);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  const { tagsData } = useTagsData();

  // ========================================
  // 【鉄壁】Viewportと初期化の最終調整
  // ========================================
  useEffect(() => {
    // Viewportの強制リセット
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    setAuthInitialized(true);
  }, []);

  const toggleTag = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      }

      let nextTags = [...prev];
      if (tagsData) {
        const tagObj = tagsData.find(dt => dt.name === tag);
        if (tagObj && (tagObj.category === 'エリア' || tagObj.category === 'スタイル')) {
          nextTags = nextTags.filter(t => {
            const tObj = tagsData.find(dt => dt.name === t);
            return !(tObj && tObj.category === tagObj.category);
          });
        }
      }
      return [...nextTags, tag];
    });
  };
  const clearTags = () => setSelectedTags([]);

  const {
    characters,
    filteredCharacters,
    ownedIds,
    loading: charactersLoading,
    error,
    filter,
    setFilter,
    toggleOwned,
    setAllOwned,
    clearAllOwned,
    setAllPermanentOwned,
    generateShareUrl,
    allTags,
    user,
    syncStatus,
  } = useCharacters(selectedTags);

  const {
    recommendations,
  } = useTeamBuilder(characters, ownedIds, tagsData, selectedAttr, selectedTags, battleCharacters);

  // 鉄壁のローディングガード
  // authInitialized (Viewport等) と charactersLoading (Auth/DB同期) 両方を待つ
  if (!authInitialized || charactersLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-slate-900"
        style={{ overflowX: 'hidden', width: '100vw' }}
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">アプリを初期化中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ overflowX: 'hidden', width: '100vw' }}
      >
        <div className="text-center space-y-3 glass p-8 rounded-2xl max-w-md">
          <p className="text-4xl">❌</p>
          <p className="text-red-400 font-semibold">エラーが発生しました</p>
          <p className="text-sm text-slate-400">{error}</p>
          <p className="text-xs text-slate-500">
            characters_data.json がプロジェクトの public/ フォルダにあることを確認してください。
          </p>
        </div>
      </div>
    );
  }

  const ownedCount = [...ownedIds].filter(id => characters.some(c => c.id === id)).length;

  return (
    <>
      <div className="min-h-screen pb-8" style={{ overflowX: 'hidden', width: '100vw' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-lg">
              ⚓
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                バウンティラッシュ
              </h1>
              <p className="text-[10px] text-slate-500 -mt-0.5">サポート設定・編成シミュレーター</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-set-all-owned"
              onClick={setAllOwned}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
            >
              全所持
            </button>
            <button
              id="btn-clear-all-owned"
              onClick={clearAllOwned}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
            >
              全解除
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden sticky top-[61px] z-40 bg-slate-900 border-b border-slate-700/50 p-1 flex">
        <button
          onClick={() => setActiveTab('team')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'team'
            ? 'bg-indigo-600 text-white shadow-lg'
            : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          👑 サポート設定・編成
        </button>
        <button
          onClick={() => setActiveTab('characters')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'characters'
            ? 'bg-indigo-600 text-white shadow-lg'
            : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          👥 キャラクター一覧
        </button>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 pt-5 pb-24 md:pb-8 space-y-6">
        <Auth user={user} />
        <div className="flex flex-col md:flex-row gap-5">
          {/* Team Panel (Left / Sidebar) */}
          <aside
            id="team-panel"
            className={`w-full md:w-[380px] flex-shrink-0 space-y-4 md:sticky md:top-16 md:self-start md:max-h-[calc(100vh-5rem)] overflow-y-auto pb-4 scrollbar-thin 
              ${activeTab === 'team' ? 'block' : 'hidden md:block'}`}
          >
            <TeamPanel
              allTags={tagsData ? allTags.filter(t => {
                const tagObj = tagsData.find(dt => dt.name === t);
                return tagObj && tagObj.effects && tagObj.effects.some(e => e.stage === 1 && e.description && e.description.trim() !== '');
              }) : allTags}
              tagsData={tagsData}
              selectedAttr={selectedAttr}
              setSelectedAttr={setSelectedAttr}
              selectedTags={selectedTags}
              toggleTag={toggleTag}
              clearTags={clearTags}
              recommendations={recommendations}
              battleCharacters={battleCharacters}
              onOpenSelector={(index) => {
                setActiveSlotIndex(index);
                setIsSelectModalOpen(true);
              }}
              onClearBattleCharacter={(index) => {
                setBattleCharacters(prev => {
                  const next = [...prev];
                  next[index] = null;
                  return next;
                });
              }}
              characters={characters}
            />
          </aside>

          {/* Character List (Right / Main) */}
          <div className={`flex-1 min-w-0 space-y-4 ${activeTab === 'characters' ? 'block' : 'hidden md:block'}`}>
            <FilterBar
              filter={filter}
              setFilter={setFilter}
              totalCount={characters.length}
              filteredCount={filteredCharacters.length}
              ownedCount={ownedCount}
              onShareUrl={generateShareUrl}
            />

            {/* Character Grid */}
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {filteredCharacters.map((c, i) => (
                <div
                  key={c.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i * 15, 300)}ms` }}
                >
                  <CharacterCard
                    character={c}
                    isOwned={ownedIds.has(c.id)}
                    onToggle={toggleOwned}
                  />
                </div>
              ))}
            </div>

            {filteredCharacters.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-slate-400">条件に合うキャラクターが見つかりません</p>
                <p className="text-xs text-slate-600 mt-1">フィルタ条件を変更してみてください</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <CharacterSelectModal
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        characters={characters}
        onSelect={(char) => {
          setBattleCharacters(prev => {
            const next = [...prev];
            next[activeSlotIndex] = char.id;
            return next;
          });
          setIsSelectModalOpen(false);
        }}
      />
      </div>

      {/* Debug Dashboard (期間限定) */}
      <div className="fixed bottom-4 left-4 z-[9999] bg-black/90 text-[10px] p-3 rounded-lg border border-slate-700 shadow-2xl font-mono text-emerald-400 space-y-1 backdrop-blur-md">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Auth:</span>
          <span>{user ? (user.isFallback ? 'Recovering...' : 'Authenticated') : (charactersLoading ? 'Syncing...' : 'Guest')}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">DB_ID:</span>
          <span className="truncate max-w-[100px]">{user?.id || 'null'}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Last_Sync:</span>
          <span className={syncStatus && syncStatus.includes('失敗') ? 'text-red-400' : 'text-emerald-400'}>{syncStatus || '未実行'}</span>
        </div>
      </div>
    </>
  );
}
