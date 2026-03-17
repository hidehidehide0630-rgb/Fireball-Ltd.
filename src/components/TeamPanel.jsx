import { useState, useEffect, useRef } from 'react';
import TagSelector from './TagSelector';
import html2canvas from 'html2canvas';
import { useSavedTeams } from '../hooks/useSavedTeams';
import BattleCharacterSelector from './BattleCharacterSelector';

const ATTR_OPTIONS = [
    { value: '赤', label: '赤', color: 'bg-red-500', ring: 'ring-red-500/50' },
    { value: '青', label: '青', color: 'bg-blue-500', ring: 'ring-blue-500/50' },
    { value: '緑', label: '緑', color: 'bg-green-500', ring: 'ring-green-500/50' },
    { value: '白', label: '白', color: 'bg-stone-200 text-gray-800', ring: 'ring-stone-200/50' },
    { value: '黒', label: '黒', color: 'bg-purple-500', ring: 'ring-purple-500/50' },
];

const ATTR_COLORS = {
    '赤': { border: 'border-red-500', glow: 'shadow-red-500/20' },
    '青': { border: 'border-blue-500', glow: 'shadow-blue-500/20' },
    '緑': { border: 'border-green-500', glow: 'shadow-green-500/20' },
    '白': { border: 'border-stone-200', glow: 'shadow-stone-200/20' },
    '黒': { border: 'border-purple-500', glow: 'shadow-purple-500/20' },
};

const STYLE_ICONS = {
    'アタッカー': '/attacker.png',
    'ディフェンダー': '/defender.png',
    'ゲッター': '/getter.png'
};

export default function TeamPanel({
    allTags,
    tagsData,
    selectedAttr,
    setSelectedAttr,
    selectedTags,
    toggleTag,
    clearTags,
    recommendations = [],
    battleCharacters,
    onOpenSelector,
    onClearBattleCharacter,
    characters,
}) {
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const panelRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const { savedTeams, saveTeam, deleteTeam } = useSavedTeams();
    const [viewingSaved, setViewingSaved] = useState(false); // 保存済み一覧を見ているか
    const [selectedSavedTeam, setSelectedSavedTeam] = useState(null); // 選択中の保存編成

    const shareImageRef = useRef(null);

    // 属性やタグの条件が変わった際にタブを先頭に戻す
    useEffect(() => {
        setActiveTabIndex(0);
    }, [selectedAttr, selectedTags]);

    const handleShareImage = async () => {
        const element = document.getElementById('export-container');
        if (!element) return;
        
        setIsCapturing(true);

        try {
            // html2canvasを使用し、scale: 2 で高精細化
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#0c0c16',
                logging: false,
            });
            
            const dataUrl = canvas.toDataURL('image/png');

            if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
                try {
                    const blob = await (await fetch(dataUrl)).blob();
                    const file = new File([blob], 'bountyrush_team.png', { type: 'image/png' });
                    await navigator.share({ title: 'バウンティラッシュ サポート編成', files: [file] });
                } catch {
                    downloadImage(dataUrl);
                }
            } else {
                downloadImage(dataUrl);
            }
        } catch (error) {
            console.error('Failed to generate image', error);
            alert('画像生成に失敗しました。\n環境や通信状況によっては生成できない場合があります。');
        } finally {
            setIsCapturing(false);
        }
    };


    const downloadImage = (dataUrl) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'bountyrush_team.png';
        link.click();
    };

    const handleSaveCurrentTeam = () => {
        if (!currentRec || currentRec.team.length === 0) return;

        let totalSupport = 0;
        const tagTotalLevel = currentRec.tagEffects.reduce((sum, e) => sum + e.level, 0);

        const success = saveTeam({
            team: currentRec.team,
            tagEffects: currentRec.tagEffects,
            selectedAttr: selectedAttr,
            totalSupport: totalSupport, // 簡易的な計算、もしくは現状は0
            tagTotalLevel: tagTotalLevel
        });

        if (success) {
            alert('現在の編成を「お気に入り」に保存しました！');
        } else {
            alert('保存に失敗しました。');
        }
    };

    // 画面に表示するチームデータ（新規生成データ または 保存済みデータ）
    const currentRec = viewingSaved && selectedSavedTeam
        ? selectedSavedTeam
        : (recommendations[activeTabIndex] || { team: [], tagEffects: [] });

    const { team, tagEffects } = currentRec;

    return (
        <div className="space-y-4">
            {/* Battle Character Selection Section */}
            <BattleCharacterSelector 
                battleCharacters={battleCharacters}
                characters={characters} 
                onOpenSelector={onOpenSelector}
                onClear={onClearBattleCharacter}
            />

            <div className="glass-strong rounded-2xl p-5 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg">
                    👑
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">サポート設定・編成</h2>
                    <p className="text-xs text-slate-400">属性とタグを選んで最適なサポートを算出</p>
                </div>
            </div>

            {/* Attribute selector */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">属性を選択</label>
                <div className="flex gap-2">
                    {ATTR_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            id={`team-attr-${opt.value}`}
                            onClick={() => setSelectedAttr(opt.value)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                ${selectedAttr === opt.value
                                    ? `${opt.color} text-white shadow-xl scale-105 ring-2 ${opt.ring}`
                                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/80'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tag selector */}
            <TagSelector
                allTags={allTags}
                tagsData={tagsData}
                selectedTags={selectedTags}
                onToggle={toggleTag}
                onClear={clearTags}
            />

            {/* Recommended team */}
            {selectedTags.length > 0 && (
                <div ref={panelRef} className="space-y-4 animate-fade-in-up bg-[#0f172a] p-1 -m-1 rounded-xl">
                    {/* Tab Navigation */}
                    <div className="flex gap-1.5 border-b border-slate-700/50 pb-2 mb-3 overflow-x-auto scrollbar-none items-center">
                        <button
                            onClick={() => {
                                setViewingSaved(false);
                                setActiveTabIndex(0);
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-all flex-shrink-0 ${!viewingSaved
                                ? 'bg-indigo-600/30 text-indigo-300 border-b-2 border-indigo-400 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                }`}
                        >
                            自動算出 ({recommendations.length})
                        </button>

                        <button
                            onClick={() => setViewingSaved(true)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-all flex-shrink-0 flex items-center gap-1 ${viewingSaved
                                ? 'bg-amber-600/30 text-amber-300 border-b-2 border-amber-400 shadow-sm'
                                : 'text-slate-400 hover:text-amber-400/80 hover:bg-amber-500/10'
                                }`}
                        >
                            <span>⭐</span> お気に入り ({savedTeams.length})
                        </button>

                        {!viewingSaved && recommendations.length > 0 && (
                            <button
                                onClick={handleSaveCurrentTeam}
                                className="px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all flex-shrink-0 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 ml-auto flex items-center gap-1"
                            >
                                <span>📥</span> 保存する
                            </button>
                        )}
                    </div>

                    {!viewingSaved && recommendations.length > 1 && (
                        <div className="flex gap-1.5 mb-4">
                            {recommendations.map((_, idx) => (
                                <button
                                    key={`tab-${idx}`}
                                    onClick={() => setActiveTabIndex(idx)}
                                    className={`flex-1 py-1 text-[10px] font-bold rounded overflow-hidden truncate px-1 transition-all ${activeTabIndex === idx
                                        ? 'bg-slate-700 text-white'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                        }`}
                                >
                                    パターン {idx + 1}
                                </button>
                            ))}
                        </div>
                    )}

                    {viewingSaved && (
                        <div className="mb-4 bg-slate-900 border border-amber-500/20 rounded-lg p-2 max-h-48 overflow-y-auto scrollbar-thin space-y-2">
                            {savedTeams.length === 0 ? (
                                <p className="text-center text-xs text-slate-500 py-3">保存された編成はありません</p>
                            ) : (
                                savedTeams.map(st => (
                                    <div
                                        key={st.id}
                                        className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${selectedSavedTeam?.id === st.id ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-800 border-slate-700 hover:border-amber-500/30'}`}
                                        onClick={() => setSelectedSavedTeam(st)}
                                    >
                                        <div>
                                            <p className="text-xs font-bold text-slate-200">
                                                {st.selectedAttr}属性
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                {new Date(st.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteTeam(st.id); if (selectedSavedTeam?.id === st.id) setSelectedSavedTeam(null); }}
                                            className="text-slate-500 hover:text-red-400 p-1"
                                            title="削除"
                                        >
                                            ✖
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 mb-4">
                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                            <span>✨</span> 推奨編成
                        </h3>
                        {team.length > 0 && (
                            <button
                                onClick={handleShareImage}
                                disabled={isCapturing}
                                className="text-[10px] font-bold px-2 py-1 bg-indigo-500/80 hover:bg-indigo-400 text-white rounded shadow transition-colors flex items-center gap-1 border border-indigo-400/50"
                            >
                                {isCapturing ? '⏳ 生成中...' : '📸 画像でシェア'}
                            </button>
                        )}
                    </div>

                    {team.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <p className="text-4xl mb-2">🔍</p>
                            <p className="text-sm">条件に合う所持キャラがいません</p>
                            <p className="text-xs text-slate-600 mt-1">キャラクター一覧で所持キャラをチェックしてください</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Badge has been removed as per user request */}


                            {/* Team grid */}
                            <div className="grid grid-cols-5 gap-2.5">
                                {team.map((c, i) => {
                                    const charColors = ATTR_COLORS[c.attr] || {};
                                    return (
                                        <div
                                            key={c.id}
                                            className={`team-slot relative rounded-xl border-2 overflow-hidden ${charColors.border} shadow-lg ${charColors.glow}`}
                                            title={`${c.name}\nマッチタグ: ${c.matchingTags.join(', ')}`}
                                        >
                                            {/* Rank badge */}
                                            <div className="absolute top-0.5 left-0.5 z-10 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-[10px] font-bold text-amber-400">
                                                {i + 1}
                                            </div>

                                            {/* Match count badge */}
                                            <div className="absolute top-0.5 right-0.5 z-10 px-1 py-0.5 rounded bg-indigo-500/90 text-[9px] font-bold text-white">
                                                {c.matchCount}hit
                                            </div>

                                            <div className="aspect-square bg-slate-800/60 overflow-hidden relative">
                                                <img
                                                    src={c.icon}
                                                    alt={c.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                                {/* Style Icon Overlay */}
                                                <div className="absolute top-1 right-1 w-4 h-4 bg-black/40 backdrop-blur-[1px] rounded flex items-center justify-center p-0.5 pointer-events-none">
                                                    <img src={STYLE_ICONS[c.style]} alt={c.style} className="w-full h-full object-contain" />
                                                </div>
                                            </div>
                                            <div className="px-1 py-1 text-center">
                                                <p className="text-[9px] font-semibold leading-tight truncate text-slate-200">
                                                    {(() => {
                                                        const name = c.name;
                                                        const parts = name.split(/[／\s/・]/);
                                                        return parts.length > 1 ? parts[parts.length - 1] : name;
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Tag breakdown has been removed as instructed */}

                            <div className="space-y-4">
                                {/* Activated Tag Effects Display */}
                                {tagEffects && tagEffects.length > 0 && (
                                    <div className="pt-2">
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">発動タグ総覧</h4>
                                        <div className="space-y-2">
                                            {tagEffects.map((tagEf, i) => (
                                                <div key={`${tagEf.name}-${i}`} className={`bg-slate-800/80 rounded-lg p-2.5 border ${tagEf.isSelected ? 'border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'border-slate-700/50'}`}>
                                                    <div className="flex items-baseline justify-between mb-1">
                                                        <span className={`text-sm font-bold ${tagEf.isSelected ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                            {tagEf.name} <span className="text-[10px] opacity-70 ml-1">Lv.{tagEf.level}</span>
                                                            {tagEf.isSelected && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">指定</span>}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-300 leading-relaxed">
                                                        {tagEf.description.split('[partition][/partition]').map((part, index) => (
                                                            <div key={index} className="flex gap-1.5 mt-0.5">
                                                                <span className={tagEf.isSelected ? "text-amber-500/70" : "text-emerald-500/70"}>・</span>
                                                                <span>{part}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Image generation is now handled via id="export-container" in App.jsx */}
        </div>
        </div>
    );
}
