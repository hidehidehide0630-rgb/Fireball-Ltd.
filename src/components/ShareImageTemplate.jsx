import { forwardRef } from 'react';

const ATTR_COLORS = {
    '赤': 'ring-red-500/80',
    '青': 'ring-blue-500/80',
    '緑': 'ring-green-500/80',
    '黒': 'ring-purple-500/80',
    '白': 'ring-stone-200/80',
    '不明': 'ring-slate-500/80',
};

// スタイルに応じた絵文字アイコンの定義
const STYLE_ICONS = {
    'アタッカー': '👊',
    'ディフェンダー': '🛡️',
    'ゲッター': '👟'
};

const ShareImageTemplate = forwardRef(({ team, tagEffects, totalSupportPercent }, ref) => {
    if (!team || team.length === 0) return null;

    const totalTagLevel = tagEffects ? tagEffects.reduce((sum, t) => sum + t.level, 0) : 0;

    return (
        <div
            ref={ref}
            className="absolute top-0 left-0 -z-50 flex items-center justify-center overflow-hidden"
            // The canvas is exactly 1200x675 (16:9 for X)
            style={{ width: '1200px', height: '675px', transform: 'translateX(-9999px)' }}
        >
            {/* 全体枠：余計な枠線(border等)を削除し、少し丸みを持たせる */}
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 flex flex-col justify-between rounded-xl shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-end mb-4 border-b border-gray-700/60 pb-4">
                    <div className="flex items-center gap-4">
                        <span className="text-4xl">🏴‍☠️</span>
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">バウンティラッシュ サポート編成</h1>
                            <p className="text-xs text-slate-400 font-medium mt-1">※全キャラフル育成想定（Lv100/スキルLv5/★9メダル3枚/ブースト2）</p>
                        </div>
                    </div>
                    <div className="flex gap-8">
                        <div className="text-right">
                            <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">概算サポート</p>
                            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                                {totalSupportPercent ? totalSupportPercent.toFixed(1) : 0}%
                            </p>
                        </div>
                        <div className="w-px bg-gray-700"></div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">発動タグ数</p>
                            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                {tagEffects ? tagEffects.length : 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Character Area */}
                <div className="flex flex-col flex-1 justify-center items-center py-2">
                    <div className="w-full max-w-[1000px] grid grid-cols-5 gap-y-6 gap-x-4 place-items-center">
                        {team.map((c, i) => {
                            const ringColor = ATTR_COLORS[c.attr] || ATTR_COLORS['不明'];
                            const styleIcon = STYLE_ICONS[c.style] || '';
                            // JSONの original_name を優先（ユーザー要望）、無ければ name を使用
                            const dispName = c.original_name || c.name;

                            return (
                                <div key={c.id} className="flex flex-col items-center gap-3 w-full">
                                    <div className={`relative w-28 h-28 rounded-2xl ring-4 ${ringColor} shadow-lg shadow-black/50 bg-gray-800`}>
                                        <div className="absolute -top-3 -left-3 z-10 w-8 h-8 rounded-full bg-black flex items-center justify-center text-sm font-bold text-white shadow-md border-2 border-gray-600">
                                            {i + 1}
                                        </div>
                                        {/* スタイルアイコンの追加（右下） */}
                                        {styleIcon && (
                                            <div className="absolute -bottom-2 -right-2 z-10 w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-600 flex items-center justify-center text-sm shadow-md">
                                                {styleIcon}
                                            </div>
                                        )}
                                        {/* アイコン画像 */}
                                        <img src={c.icon} alt={dispName} className="w-full h-full object-cover rounded-xl" crossOrigin="anonymous" />
                                    </div>
                                    <p className="text-xs font-semibold text-gray-200 truncate w-full text-center px-2">
                                        {dispName}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Activated Tags Area */}
                <div className="bg-gray-800/40 rounded-2xl p-5 mt-4">
                    <h2 className="text-base font-bold text-gray-300 mb-4 flex items-center gap-2">
                        <span className="text-lg">✨</span> 発動中のサポート効果
                    </h2>
                    <div className="flex flex-wrap gap-2.5 max-h-36 overflow-hidden">
                        {tagEffects && tagEffects.map((tagEf, i) => (
                            <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm border ${tagEf.isSelected ? 'bg-indigo-900/40 border-indigo-500/40' : 'bg-gray-700/60 border-gray-600'}`}>
                                <span className={`text-[13px] font-bold ${tagEf.isSelected ? 'text-indigo-300' : 'text-gray-200'}`}>
                                    {tagEf.name} {tagEf.isSelected && '⭐'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

ShareImageTemplate.displayName = 'ShareImageTemplate';

export default ShareImageTemplate;
