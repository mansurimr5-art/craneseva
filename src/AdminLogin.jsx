
import { useState } from 'react'
import { supabase } from './supabase'
import './AdminLogin.css'

export default function AdminLogin({ onLogin }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleLogin(e) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { data, error: loginError } =
                await supabase.auth.signInWithPassword({
                    email,
                    password
                })

            if (loginError) throw loginError

            const { data: profile, error: profileError } =
                await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single()

            if (profileError || profile?.role !== 'admin') {
                await supabase.auth.signOut()
                throw new Error('Admin access is not authorized.')
            }

            onLogin(data.user)
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="admin-login-page">
            <form className="admin-login-card" onSubmit={handleLogin}>
                <div className="admin-login-logo">CRANE<span>SEVA</span></div>
                <p className="admin-login-label">SECURE ADMIN PANEL</p>
                <h1>Welcome Back</h1>
                <p className="admin-login-description">
                    Sign in to manage CraneSeva marketplace.
                </p>

                <label>Email Address</label>
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter admin email"
                    required
                />

                <label>Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                />

                {error && <p className="admin-login-error">{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Signing in...' : 'Secure Admin Login'}
                </button>
            </form>
        </main>
    )
}
