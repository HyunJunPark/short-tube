'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const { register, isRegistering, registerError, isAuthenticated } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/')
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    // Validate password match
    if (password !== confirmPassword) {
      setLocalError('비밀번호가 일치하지 않습니다.')
      return
    }

    // Validate password length
    if (password.length < 6) {
      setLocalError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    // Validate username length
    if (username.length < 3) {
      setLocalError('사용자명은 최소 3자 이상이어야 합니다.')
      return
    }

    register({ username, email, password })
  }

  const errorMessage = localError || registerError?.message

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">회원가입</h1>
          <p className="text-gray-600 dark:text-gray-400">
            새 계정을 만들어보세요
          </p>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">사용자명</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="홍길동"
              required
              disabled={isRegistering}
              minLength={3}
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              disabled={isRegistering}
            />
          </div>

          <div>
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isRegistering}
              minLength={6}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isRegistering}
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isRegistering}
          >
            {isRegistering ? '가입 중...' : '회원가입'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            이미 계정이 있으신가요?{' '}
          </span>
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            로그인
          </Link>
        </div>
      </Card>
    </div>
  )
}
