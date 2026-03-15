import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Auth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 現在のセッションを確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 認証状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) console.error('Login Error:', error.message)
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Logout Error:', error.message)
  }

  if (loading) return null

  return (
    <div className="glass-strong rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl shadow-inner">
          {user ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="avatar" 
              className="w-full h-full rounded-full border-2 border-indigo-500/50" 
            />
          ) : (
            '👤'
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-100">
            {user ? user.user_metadata.full_name : 'ゲストユーザー'}
          </p>
          <p className="text-xs text-slate-400">
            {user ? 'クラウド同期中' : 'ログインして他端末と同期'}
          </p>
        </div>
      </div>

      <div>
        {user ? (
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2"
          >
            <span>🚪</span> ログアウト
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 transition-all flex items-center gap-2 scale-105 active:scale-100"
          >
            <span className="text-lg">G</span> Googleでログイン
          </button>
        )}
      </div>
    </div>
  )
}
