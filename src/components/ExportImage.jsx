import { forwardRef } from 'react';

// ========================================
// 属性カラー定義
// ========================================
const ATTR_COLORS = {
    '赤': { main: '#ef4444', light: '#fee2e2', dark: '#991b1b' },
    '青': { main: '#3b82f6', light: '#dbeafe', dark: '#1e40af' },
    '緑': { main: '#22c55e', light: '#dcfce7', dark: '#166534' },
    '黒': { main: '#a855f7', light: '#f3e8ff', dark: '#6b21a8' },
    '白': { main: '#737373', light: '#f5f5f5', dark: '#262626' },
    '不明': { main: '#64748b', light: '#f1f5f9', dark: '#1e293b' },
};

const STYLE_ICONS = {
    'アタッカー': '👊',
    'ディフェンダー': '🛡️',
    'ゲッター': '👟'
};

// ========================================
// Tag Effect Mapping (定数オブジェクトでの管理)
// 実際には tags_data.json から取得可能だが、指示通り定数として定義可能な形にする
// ========================================
const SUPPORT_EFFECT_MAP = {
    // 主要なタグのみ例示（TODO: 全タグ網羅するか動的取得と併用）
    '麦わらの一味': 'クリティカルで受けるダメージが30%減少する',
    '最悪の世代': '敵・自チームお宝エリアでのふっとばし距離が30％増加する',
    'アタッカー': '攻撃力が200増加する / クリティカルダメージが5%増加する',
    'ディフェンダー': '防御力が200増加する / お宝ゲージ回復速度が10%増加する',
    'ゲッター': '体力が800増加する / お宝奪取時の初期値が30%増加する',
    '東の海': '同じ属性の敵に与えるダメージが15%増加する',
    'グランドライン': '同じ属性から受けるダメージが15%減少する',
    '新世界': '苦手属性の敵に与えるダメージが15%増加する',
    '動物系能力者': '苦手属性の敵から受けるダメージを15％減少する',
};

const ExportImage = forwardRef(({ team, tagEffects, battleCharacters = [], characters = [] }, ref) => {
    if (!team || team.length === 0) return null;

    // バトルキャラ取得
    const battleChars = battleCharacters.map(id =>
        id ? characters.find(c => c.id === id) : null
    );

    // Lv.600タグ抽出
    const maxLevelTags = tagEffects
        ? tagEffects.filter(t => t.level >= 600)
        : [];

    return (
        <div
            id="export-container"
            ref={ref}
            style={{
                position: 'fixed',
                top: '-10000px',
                left: '-10000px',
                width: '1200px',
                height: '900px',
                backgroundColor: '#0c0c16',
                fontFamily: "'Montserrat', 'Noto Sans JP', sans-serif",
                color: '#fff',
                overflow: 'hidden',
                zIndex: -100,
            }}
        >
            {/* 背景グラデーション */}
            <div style={{
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle at 50% 50%, #1e1e3a 0%, #0c0c16 100%)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                padding: '40px',
            }}>
                
                {/* 装飾用背景パターン */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                    pointerEvents: 'none',
                }} />

                {/* ===== 上部: バトルキャラセクション ===== */}
                <div style={{ 
                    display: 'flex', 
                    gap: '24px', 
                    marginBottom: '40px',
                    perspective: '1000px'
                }}>
                    {[0, 1].map(idx => {
                        const bc = battleChars[idx];
                        const attrColor = bc ? (ATTR_COLORS[bc.attr] || ATTR_COLORS['不明']).main : '#475569';
                        
                        return (
                            <div key={idx} style={{
                                flex: 1,
                                height: '240px',
                                background: 'linear-gradient(135deg, #161625 0%, #0a0a14 100%)',
                                border: `2px solid #d97706`,
                                transform: idx === 0 ? 'skewX(-4deg)' : 'skewX(4deg)',
                                borderRadius: '4px',
                                position: 'relative',
                                display: 'flex',
                                overflow: 'hidden',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                            }}>
                                {/* skew分を戻すインナー */}
                                <div style={{
                                    transform: idx === 0 ? 'skewX(4deg)' : 'skewX(-4deg)',
                                    display: 'flex',
                                    width: '100%',
                                    height: '100%',
                                    position: 'relative',
                                }}>
                                    {bc ? (
                                        <>
                                            {/* キャラ画像 */}
                                            <div style={{
                                                width: '200px',
                                                height: '100%',
                                                flexShrink: 0,
                                                position: 'relative',
                                            }}>
                                                <img 
                                                    src={bc.icon} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    crossOrigin="anonymous" 
                                                />
                                                <div style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    background: 'linear-gradient(to right, transparent 50%, #0a0a14 100%)',
                                                }} />
                                            </div>

                                            {/* 情報 */}
                                            <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    <span style={{ 
                                                        background: attrColor, 
                                                        color: '#fff', 
                                                        padding: '2px 8px', 
                                                        borderRadius: '4px', 
                                                        fontSize: '12px', 
                                                        fontWeight: 900 
                                                    }}>
                                                        {bc.attr}
                                                    </span>
                                                    <span style={{ fontSize: '18px' }}>{STYLE_ICONS[bc.style]}</span>
                                                </div>
                                                <h3 style={{ 
                                                    fontSize: '28px', 
                                                    fontWeight: 900, 
                                                    color: '#fff', 
                                                    margin: 0,
                                                    marginBottom: '16px',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                                }}>
                                                    {bc.original_name || bc.name}
                                                </h3>
                                                
                                                <div style={{ marginTop: 'auto' }}>
                                                    <p style={{ fontSize: '12px', color: '#d97706', fontWeight: 900, margin: 0 }}>TOTAL POWER</p>
                                                    <p style={{ 
                                                        fontSize: '48px', 
                                                        fontWeight: 900, 
                                                        color: '#f59e0b', 
                                                        margin: 0,
                                                        lineHeight: 1,
                                                        letterSpacing: '-2px'
                                                    }}>
                                                        12,450
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: '24px', fontWeight: 900 }}>
                                            NO UNIT
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ===== 中央: サポートキャラセクション ===== */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '4px', height: '20px', backgroundColor: '#d97706' }} />
                        <h4 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#f59e0b', letterSpacing: '2px' }}>SUPPORT UNITS</h4>
                    </div>
                    
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(5, 1fr)', 
                        gap: '16px' 
                    }}>
                        {team.map((c, i) => {
                            const attrColor = (ATTR_COLORS[c.attr] || ATTR_COLORS['不明']).main;
                            return (
                                <div key={c.id} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '16px',
                                    padding: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    position: 'relative',
                                }}>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: `2px solid ${attrColor}`,
                                        boxShadow: `0 0 20px ${attrColor}30`,
                                        position: 'relative',
                                    }}>
                                        <img 
                                            src={c.icon} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            crossOrigin="anonymous" 
                                        />
                                        {/* 光沢演出 */}
                                        <div style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, height: '50%',
                                            background: 'linear-gradient(rgba(255,255,255,0.15) 0%, transparent 100%)',
                                        }} />
                                    </div>
                                    <p style={{
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        marginTop: '8px',
                                        textAlign: 'center',
                                        margin: '8px 0 0 0',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        width: '100%',
                                        color: '#cbd5e1'
                                    }}>
                                        {c.name}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ===== 下部: タグリスト & Lv.600詳細 ===== */}
                <div style={{ display: 'flex', gap: '32px', flex: 1, minHeight: 0 }}>
                    {/* 左: 発動中タグバッジ */}
                    <div style={{ flex: '0 0 400px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '4px', height: '20px', backgroundColor: '#d97706' }} />
                            <h4 style={{ fontSize: '14px', fontWeight: 900, margin: 0, color: '#f59e0b' }}>ACTIVATED TAGS</h4>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {tagEffects && tagEffects.map((t, i) => (
                                <div key={i} style={{
                                    background: t.isSelected ? 'linear-gradient(to right, #d97706, #f59e0b)' : 'rgba(255,255,255,0.08)',
                                    borderRadius: '4px',
                                    padding: '4px 10px',
                                    fontSize: '11px',
                                    fontWeight: 900,
                                    color: t.isSelected ? '#000' : '#d1d5db',
                                    border: t.isSelected ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                }}>
                                    {t.name} Lv.{t.level}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 右: Lv.600詳細 */}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '4px', height: '20px', backgroundColor: '#7c3aed' }} />
                            <h4 style={{ fontSize: '14px', fontWeight: 900, margin: 0, color: '#a78bfa' }}>MAX LEVEL TAG EFFECTS (Lv.600)</h4>
                        </div>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}>
                            {maxLevelTags.map((tag, i) => {
                                const effectText = SUPPORT_EFFECT_MAP[tag.name] || tag.description.replace(/\[partition\]\[\/partition\]/g, ' / ');
                                return (
                                    <div key={i} style={{ fontSize: '11px', lineHeight: 1.4 }}>
                                        <span style={{ fontWeight: 900, color: '#f59e0b' }}>{tag.name}：</span>
                                        <span style={{ color: '#cbd5e1' }}>{effectText}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* フッター */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', opacity: 0.4 }}>
                    <p style={{ fontSize: '10px', margin: 0 }}>※全キャラフル育成想定（Lv100/スキルLv5/★9メダル3枚/ブースト2）</p>
                    <p style={{ fontSize: '10px', margin: 0, fontWeight: 900 }}>BOUNTY RUSH SUPPORT SIMULATOR</p>
                </div>
            </div>
        </div>
    );
});

ExportImage.displayName = 'ExportImage';

export default ExportImage;
