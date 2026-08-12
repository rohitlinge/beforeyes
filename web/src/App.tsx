import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Seo } from '@/components/Seo'
import { ToastProvider } from '@/components/Toast'
import { AuthProvider } from '@/features/auth/AuthProvider'
import {
  ProtectedRoute,
  PublicOnlyRoute,
  VerifyEmailRoute,
} from '@/features/auth/ProtectedRoute'
import {
  THERAPISTS_ADMIN_PATH,
  THERAPISTS_PATH,
  THERAPISTS_REGISTER_PATH,
} from '@/features/consultants/paths'
import { LandingPage } from '@/pages/LandingPage'
import { AuthPage } from '@/pages/AuthPage'
import { VerifyEmailPage } from '@/pages/VerifyEmailPage'
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
import { ConsultantRegisterPage } from '@/pages/ConsultantRegisterPage'
import { ConsultantsDirectoryPage } from '@/pages/ConsultantsDirectoryPage'
import { ConsultantProfilePage } from '@/pages/ConsultantProfilePage'
import { AdminConsultantsPage } from '@/pages/AdminConsultantsPage'

function LegacyConsultantSlugRedirect() {
  const { slug } = useParams()
  return <Navigate to={`${THERAPISTS_PATH}/${slug ?? ''}`} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Seo />
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
              path="/verify-email"
              element={
                <VerifyEmailRoute>
                  <VerifyEmailPage />
                </VerifyEmailRoute>
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

            <Route
              path={THERAPISTS_PATH}
              element={<ConsultantsDirectoryPage />}
            />
            <Route
              path={THERAPISTS_REGISTER_PATH}
              element={<ConsultantRegisterPage />}
            />
            <Route
              path={`${THERAPISTS_PATH}/:slug`}
              element={<ConsultantProfilePage />}
            />
            <Route
              path={THERAPISTS_ADMIN_PATH}
              element={
                <ProtectedRoute>
                  <AdminConsultantsPage />
                </ProtectedRoute>
              }
            />

            {/* Legacy consultant URLs → relationship therapists */}
            <Route
              path="/consultants"
              element={<Navigate to={THERAPISTS_PATH} replace />}
            />
            <Route
              path="/consultants/register"
              element={<Navigate to={THERAPISTS_REGISTER_PATH} replace />}
            />
            <Route
              path="/consultants/:slug"
              element={<LegacyConsultantSlugRedirect />}
            />
            <Route
              path="/admin/consultants"
              element={<Navigate to={THERAPISTS_ADMIN_PATH} replace />}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
