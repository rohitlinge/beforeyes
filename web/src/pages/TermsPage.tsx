import { Link } from 'react-router-dom'
import { LegalDocLayout } from '@/components/LegalDocLayout'

export function TermsPage() {
  return (
    <LegalDocLayout title="Terms of Use" updated="August 10, 2026">
      <p>
        By creating an account or using BeforeYes, you agree to these
        terms. If you do not agree, do not use the app.
      </p>

      <h2>Eligibility</h2>
      <p>
        You must be at least 18 years old. The app is for serious, consensual
        conversations between two adults—not for minors, dating discovery, or
        public matching.
      </p>

      <h2>What the product is</h2>
      <p>
        BeforeYes is a private two-player tool: create or join a
        room, build questions, answer, then mark Agree or Disagree on each answer
        to reveal a shared compatibility percentage. You may download a session
        report for yourselves or a consultant. It is not legal, medical, or
        relationship counseling advice.
      </p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Provide accurate account information and keep your login secure.</li>
        <li>Only invite someone who has agreed to participate with you.</li>
        <li>
          Do not use the app to harass, coerce, impersonate, or share another
          person’s private content outside the room without their consent.
        </li>
        <li>
          Do not attempt to bypass security rules, scrape data, or disrupt the
          service.
        </li>
      </ul>

      <h2>Content</h2>
      <p>
        You are responsible for the questions and answers you submit. We do not
        pre-screen room content. We may remove accounts or rooms that clearly
        violate these terms or applicable law.
      </p>

      <h2>Availability</h2>
      <p>
        The service is provided free during this launch period, without usage
        caps, on a best-effort basis. Features may change; we may experience
        downtime or data loss. Do not rely on the app as your only record of an
        important conversation.
      </p>

      <h2>Disclaimers</h2>
      <p>
        The app is provided “as is” without warranties of any kind. We are not
        liable for relationship outcomes, decisions you make after a compatibility
        score or downloaded report, or disputes between partners. To the fullest extent permitted by
        law, our liability is limited to the amount you paid us for the service in
        the last 12 months (currently zero for the free launch).
      </p>

      <h2>Privacy</h2>
      <p>
        Our{' '}
        <Link to="/privacy" className="font-semibold text-primary">
          Privacy Policy
        </Link>{' '}
        describes how account and room data are handled.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Continued use after an update means you accept
        the revised terms. The “Last updated” date will reflect changes.
      </p>

      <h2>Contact</h2>
      <p>Questions about these terms: use Feedback in the app footer.</p>
    </LegalDocLayout>
  )
}
