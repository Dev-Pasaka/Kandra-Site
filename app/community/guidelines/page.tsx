import type { Metadata } from "next";
import { PageShell } from "@/components/community/page-shell";
import { KANDRA_REPO_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Community guidelines",
  description: "What you can share on the Kandra community pages, how moderation works, and what we store about you.",
};

export default function GuidelinesPage() {
  return (
    <PageShell title="Community guidelines">
      <div className="kandra-prose">
        <h2 id="what-to-share">What to share</h2>
        <ul>
          <li>Your own articles, videos and talks about Kandra, or about ScyllaDB and Cassandra data modeling in Kotlin.</li>
          <li>Posts written here, with your own screenshots, diagrams and short videos.</li>
          <li>Libraries, sample apps, guides, tools and templates that help people use Kandra.</li>
          <li>Work by others is welcome as a resource if it&apos;s genuinely useful. Say who made it in the summary.</li>
        </ul>

        <h2 id="what-not-to-share">What we remove</h2>
        <ul>
          <li>Spam, affiliate links, SEO pages, and anything unrelated to Kandra or distributed data modeling.</li>
          <li>Paywalled or sign-up-walled content without a free version.</li>
          <li>Harassment, hateful content, or anything illegal.</li>
          <li>Copies of someone else&apos;s work presented as your own.</li>
        </ul>

        <h2 id="uploads">Images and videos</h2>
        <p>
          Upload only media you made or have the right to share. Images can be up to 5 MB (PNG, JPEG,
          GIF, WebP, AVIF) and videos up to 50 MB (MP4, WebM), with a limit of 30 files or 200 MB a
          day. Uploads stay private to you and moderators until the post that uses them is approved.
        </p>

        <h2 id="moderation">How moderation works</h2>
        <p>
          A moderator reviews every new submission and post before it appears. Once three of your submissions
          have been approved, new ones publish right away. Anyone signed in can report an item, and a
          moderator decides whether it stays. You can see the status of everything you submitted, and
          the reason if it wasn&apos;t accepted, under My submissions.
        </p>
        <p>
          Outbound links are marked <code>nofollow ugc</code>, so posting here doesn&apos;t pass search
          ranking.
        </p>

        <h2 id="your-content">Your content</h2>
        <p>
          You keep the rights to what you link to. By submitting, you let us show its title, summary and
          link on this site. If something here is yours and you want it removed, delete it from My
          submissions, or open an issue on <a href={`${KANDRA_REPO_URL}/issues`}>GitHub</a>.
        </p>

        <h2 id="privacy">What we store</h2>
        <p>
          Signing in with GitHub gives us your public profile: user id, username, display name and
          avatar. We don&apos;t request access to your repositories or email. We store what you submit,
          your posts and uploads, your votes and your reports, plus a session cookie that keeps you signed in for 30 days.
          Deleting your account under My submissions removes all of it.
        </p>
      </div>
    </PageShell>
  );
}
