
import { useState } from 'react'
import { supabase } from './supabase'
import './SupplierAuth.css'

const districts = [
    'Indore', 'Bhopal', 'Ujjain', 'Dewas', 'Dhar', 'Pithampur',
    'Jabalpur', 'Gwalior', 'Ratlam', 'Sagar', 'Rewa', 'Satna',
    'Mandsaur', 'Neemuch', 'Khargone', 'Khandwa', 'Burhanpur',
    'Shajapur', 'Sehore', 'Raisen', 'Vidisha', 'Narmadapuram',
    'Betul', 'Chhindwara', 'Seoni', 'Balaghat', 'Mandla', 'Dindori',
    'Katni', 'Umaria', 'Shahdol', 'Anuppur', 'Sidhi', 'Singrauli',
    'Panna', 'Chhatarpur', 'Tikamgarh', 'Niwari', 'Damoh', 'Datia',
    'Shivpuri', 'Guna', 'Ashoknagar', 'Morena', 'Bhind', 'Sheopur',
    'Barwani', 'Alirajpur', 'Jhabua', 'Agar Malwa', 'Maihar',
    'Mauganj', 'Pandhurna', 'Other MP Location'
]

export default function SupplierAuth({ onClose }) {
    const [mode, setMode] = useState('signup')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')
        setError('')

        const form = new FormData(e.currentTarget)
        const email = String(form.get('email')).trim().toLowerCase()
        const password = String(form.get('password'))
        const phone = String(form.get('phone') || '').trim()

        try {
            if (mode === 'signup') {
                if (!/^[0-9]{10}$/.test(phone)) {
                    throw new Error('Enter a valid 10-digit mobile number.')
                }

                const metadata = {
                    account_type: 'supplier',
                    full_name: String(form.get('full_name')).trim(),
                    company_name: String(form.get('company_name')).trim(),
                    phone,
                    district: String(form.get('district'))
                }

                const { data, error: signupError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: metadata
                    }
                })

                if (signupError) throw signupError

                if (data.session) {
                    setMessage('Registration successful! Your supplier account is pending admin verification.')
                } else {
                    setMessage('Registration received! Please check your email and confirm your account before logging in.')
                }

                e.currentTarget.reset()
            } else {
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

                if (profileError) throw profileError

                if (profile?.role !== 'supplier') {
                    await supabase.auth.signOut()
                    throw new Error('This account is not registered as a supplier.')
                }

                setMessage('Supplier login successful! Your account is ready for dashboard access.')
                window.location.reload()
            }
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="supplier-auth-page">
            <div className="supplier-auth-card">
                <button
                    className="supplier-auth-close"
                    type="button"
                    onClick={onClose}
                >
                    ← Back to website
                </button>

                <div className="supplier-auth-brand">
                    <span className="supplier-auth-symbol">C</span>
                    CRANE<span>SEVA</span>
                </div>

                <p className="supplier-auth-tag">CRANESEVA SUPPLIER NETWORK</p>

                <h1>
                    {mode === 'signup' ? 'Join our supplier network.' : 'Welcome back.'}
                </h1>

                <p className="supplier-auth-description">
                    {mode === 'signup'
                        ? 'Register your company and equipment with CraneSeva, Madhya Pradesh.'
                        : 'Log in to your CraneSeva supplier account.'}
                </p>

                <div className="supplier-auth-tabs">
                    <button
                        type="button"
                        className={mode === 'signup' ? 'active' : ''}
                        onClick={() => {
                            setMode('signup')
                            setMessage('')
                            setError('')
                        }}
                    >
                        Create Account
                    </button>

                    <button
                        type="button"
                        className={mode === 'login' ? 'active' : ''}
                        onClick={() => {
                            setMode('login')
                            setMessage('')
                            setError('')
                        }}
                    >
                        Supplier Login
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="supplier-auth-form">
                    {mode === 'signup' && (
                        <>
                            <label>
                                Company Name *
                                <input
                                    name="company_name"
                                    placeholder="Your company or business name"
                                    required
                                />
                            </label>

                            <label>
                                Owner / Contact Person *
                                <input
                                    name="full_name"
                                    placeholder="Full name"
                                    required
                                />
                            </label>

                            <label>
                                Mobile Number *
                                <input
                                    name="phone"
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]{10}"
                                    maxLength="10"
                                    placeholder="10-digit mobile number"
                                    required
                                />
                            </label>

                            <label>
                                Business Location *
                                <select name="district" required defaultValue="">
                                    <option value="" disabled>Select district</option>
                                    {districts.map(district => (
                                        <option key={district} value={district}>
                                            {district}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </>
                    )}

                    <label>
                        Email Address *
                        <input
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                        />
                    </label>

                    <label>
                        Password *
                        <input
                            name="password"
                            type="password"
                            minLength="8"
                            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                            placeholder="At least 8 characters"
                            required
                        />
                    </label>

                    {error && <div className="supplier-auth-error">{error}</div>}
                    {message && <div className="supplier-auth-success">{message}</div>}

                    <button
                        className="supplier-auth-submit"
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? 'Please wait...'
                            : mode === 'signup'
                                ? 'Create Supplier Account →'
                                : 'Login to Supplier Account →'}
                    </button>
                </form>

                <p className="supplier-auth-note">
                    Supplier accounts require CraneSeva verification.
                    Your contact details are not displayed publicly.
                </p>
            </div>
        </main>
    )
}
