import { LegalDocLayout } from '@/components/LegalDocLayout'

export function PrivacyPolicyPage() {
  return (
    <LegalDocLayout title="Privacy Policy" updated="August 10, 2026">
      <p>
        BeforeYes (“we”, “the app”) helps two people have a private,
        structured conversation before a serious commitment. This policy explains
        what we collect and how we use it.
      </p>

      <h2>Who this is for</h2>
      <p>
        The product is intended for adults only (18+). If you are under 18, do not
        create an account or use the app.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong className="text-on-surface">Account data:</strong> email,
          display name, username, and authentication identifiers from Firebase
          Auth.
        </li>
        <li>
          <strong className="text-on-surface">Room content:</strong> questions,
          answers, and Agree/Disagree ratings you submit inside a private room, stored
          in Cloud Firestore for that session.
        </li>
        <li>
          <strong className="text-on-surface">Usage signals:</strong> optional
          product analytics events (for example signup, room created, phase
          completed) to understand whether the product works. These do not include
          the text of your questions or answers.
        </li>
      </ul>

      <h2>How we use information</h2>
      <ul>
        <li>To run the two-player room loop (lobby → questions → answers → alignment score).</li>
        <li>To keep private drafts private until both partners are ready to exchange.</li>
        <li>To improve reliability and fix bugs.</li>
      </ul>

      <h2>Sharing</h2>
      <p>
        We do not sell your personal data. Room content is shared only with the
        other member of that room, according to the product rules (for example,
        questions and answers unlock together; detailed Agree/Disagree ratings stay
        private to each partner while a shared compatibility percentage is revealed
        when both finish).
      </p>
      <p>
        Infrastructure is provided by Google Firebase (Authentication, Firestore,
        Hosting, and optionally Analytics / Cloud Functions). Their processing is
        governed by Google’s terms and privacy documentation for those services.
      </p>

      <h2>Retention</h2>
      <p>
        Account and room data remain until you leave/close a room or we remove data
        as part of product maintenance. Future versions may add automatic deletion
        windows; until then, treat room content as stored for the life of the room
        record.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>You can stop using the app and close rooms you belong to.</li>
        <li>
          You can request account or data deletion by contacting us through the
          Feedback link in the app footer.
        </li>
      </ul>

      <h2>Security</h2>
      <p>
        We use Firebase Authentication and Firestore security rules so that private
        drafts and per-answer ratings are not readable by the other partner before
        the intended exchange. No system is perfect—only share what you are comfortable
        putting in writing with your partner.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy as the product evolves. The “Last updated” date
        at the top will change when we do.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy: use the Feedback link in the footer, or email the
        address listed on the Feedback page.
      </p>
    </LegalDocLayout>
  )
}
