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

// ========================================
// 1. 最優先ロジック: URLハッシュの消去と強制リフレッシュ
// ブラウザの「PC版誤認」をリセット状態で解除するために実行
// ========================================
if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token=')) {
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState(null, null, cleanUrl);
  window.location.reload();
}

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
  // 2. 認証状態とViewportの直接管理
  // ========================================
  useEffect(() => {
    // 起動時に最新のセッションを確認
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setAuthInitialized(true);
        
        // Viewportの強制リセット（ブラウザに再認識させる）
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setAuthInitialized(true);
      }
    };

    checkAuth();

    // ログイン状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // ログイン成功時にもViewportを再リセット
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
      }
    });

    return () => subscription.unsubscribe();
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
  } = useCharacters(selectedTags);

  const {
    recommendations,
  } = useTeamBuilder(characters, ownedIds, tagsData, selectedAttr, selectedTags, battleCharacters);

  // 認証チェックとデータの読み込み両方を待つ
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
        <Auth />
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
  );
}
