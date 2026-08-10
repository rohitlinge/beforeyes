import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/Toast'
import { AuthProvider } from '@/features/auth/AuthProvider'
import {
  ProtectedRoute,
  PublicOnlyRoute,
} from '@/features/auth/ProtectedRoute'
import { LandingPage } from '@/pages/LandingPage'
import { AuthPage } from '@/pages/AuthPage'
import { AppHomePage } from '@/pages/AppHomePage'
import { JoinPage } from '@/pages/JoinPage'
import { LobbyPage } from '@/pages/LobbyPage'
import { QuestionBuilderPage } from '@/pages/QuestionBuilderPage'
import { AnswerPhasePage } from '@/pages/AnswerPhasePage'
import { AnswerReviewPage } from '@/pages/AnswerReviewPage'
import { VerdictPage } from '@/pages/VerdictPage'
import { ResultPage } from '@/pages/ResultPage'
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'
import { TermsPage } from '@/pages/TermsPage'
import { FeedbackPage } from '@/pages/FeedbackPage'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <AuthPage mode="login" />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicOnlyRoute>
                  <AuthPage mode="signup" />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppHomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/join"
              element={
                <ProtectedRoute>
                  <JoinPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/join/:roomId"
              element={
                <ProtectedRoute>
                  <JoinPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/room/:roomId/lobby"
              element={
                <ProtectedRoute>
                  <LobbyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/room/:roomId/questions"
              element={
                <ProtectedRoute>
                  <QuestionBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/room/:roomId/answers"
              element={
                <ProtectedRoute>
                  <AnswerPhasePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/room/:roomId/review"
              element={
                <ProtectedRoute>
                  <AnswerReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/room/:roomId/verdict"
              element={
                <ProtectedRoute>
                  <VerdictPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/room/:roomId/result"
              element={
                <ProtectedRoute>
                  <ResultPage />
                </ProtectedRoute>
              }
            />

            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
