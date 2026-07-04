
import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card'
import { Alert, AlertDescription } from '@/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs'
import { MapPin, Loader2, Users, Building } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RoleBasedRedirect } from '@/features/auth/components/RoleBasedRedirect'
import { useTranslation } from 'react-i18next'

export default function AuthPage() {
  const { t } = useTranslation()
  const { user, profile, signIn, signUp, loading: authLoading } = useAuth()

  // Supabase auth errors arrive as English sentences; map the known ones
  // to i18n keys and never surface the raw message to the user.
  const mapAuthError = (message: string | undefined, fallback: string): string => {
    if (!message) return fallback
    const m = message.toLowerCase()
    if (m.includes('already registered')) return t('auth.accountExists')
    if (m.includes('invalid login credentials')) return t('auth.invalidCredentials')
    if (m.includes('email not confirmed')) return t('auth.emailNotConfirmed')
    if (m.includes('rate limit') || m.includes('too many requests')) return t('auth.tooManyAttempts')
    if (m.includes('password should be')) return t('auth.passwordLength')
    if (m.includes('unable to validate email') || m.includes('invalid email')) return t('auth.invalidEmail')
    console.error('Unmapped auth error:', message)
    return fallback
  }
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  // Determine user type from URL params or default to traveler
  const userTypeFromUrl = searchParams.get('type') as 'traveler' | 'agency' | null
  const [userType, setUserType] = useState<'traveler' | 'agency'>(userTypeFromUrl || 'traveler')

  // Form data
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [companyName, setCompanyName] = useState('')

  // Update user type when URL changes
  useEffect(() => {
    if (userTypeFromUrl) {
      setUserType(userTypeFromUrl)
    }
  }, [userTypeFromUrl])

  // If user is already authenticated, handle role-based redirect
  if (user && profile && !authLoading) {
    return <RoleBasedRedirect />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError(t('auth.passwordMismatch'))
          return
        }

        if (password.length < 6) {
          setError(t('auth.passwordLength'))
          return
        }

        const userData = {
          first_name: firstName,
          last_name: lastName,
          role: userType,
          ...(userType === 'agency' && { company_name: companyName })
        }

        const { error } = await signUp(email, password, userData)
        if (error) {
          setError(mapAuthError(error.message, t('auth.failedToCreate')))
        } else {
          setSuccess(t('auth.accountCreated'))
          setEmail('')
          setPassword('')
          setConfirmPassword('')
          setFirstName('')
          setLastName('')
          setCompanyName('')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setError(mapAuthError(error.message, t('auth.failedToSignIn')))
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError(t('auth.unexpectedError'))
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-blue-600">ToTravel</span>
        </Link>

        {/* User Type Selection */}
        <div className="mb-6">
          <div className="flex gap-4 justify-center">
            <Link
              to={`/auth?type=traveler`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${userType === 'traveler'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Users className="w-4 h-4" />
              <span>{t('auth.traveler')}</span>
            </Link>
            <Link
              to={`/auth?type=agency`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${userType === 'agency'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Building className="w-4 h-4" />
              <span>{t('auth.agency')}</span>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {mode === 'signin' ? t('auth.welcomeBack') : t('auth.createAccount')}
            </CardTitle>
            <CardDescription>
              {userType === 'agency' ? t('auth.agencyPortal') : t('auth.travelerPortal')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <Tabs value={mode} onValueChange={(value) => {
              setMode(value as 'signin' | 'signup')
              setError('')
              setSuccess('')
            }} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">{t('auth.signinTab')}</TabsTrigger>
                <TabsTrigger value="signup">{t('auth.signupTab')}</TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {userType === 'agency' && (
                    <div>
                      <Label htmlFor="companyName">{t('auth.companyName')}</Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                ) : null}
                {mode === 'signin' ? t('auth.signInBtn') : t('auth.createAccountBtn')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {mode === 'signin' ? t('auth.noAccount') : t('auth.haveAccount')}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-blue-600 hover:underline px-1"
                >
                  {mode === 'signin' ? t('auth.signupTab') : t('auth.signinTab')}
                </button>
              </p>
            </div>

            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600">
                {t('auth.termsAgree')}{' '}
                <a href="#" className="text-blue-600 hover:underline">{t('auth.termsOfService')}</a>{' '}
                {t('auth.and')}{' '}
                <a href="#" className="text-blue-600 hover:underline">{t('auth.privacyPolicy')}</a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
