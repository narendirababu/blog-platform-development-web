import { PostCard } from '@/components/PostCard';
import type { PostWithAuthor } from '@/lib/types';

interface HomePageProps {
  posts: PostWithAuthor[];
  loading: boolean;
}

export default function HomePage({ posts, loading }: HomePageProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <section className="mb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Stories worth reading,
          <br />
          <span className="text-slate-500">ideas worth sharing</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
          A place for writers to publish their thoughts and readers to discover
          new perspectives. Join the conversation.
        </p>
      </section>

      {/* Featured posts */}
      <section>
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Latest posts
          </h2>
          <span className="text-sm text-slate-500">{posts.length} articles</span>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="mb-4 h-40 rounded-lg bg-slate-200" />
                <div className="mb-2 h-4 w-1/3 rounded bg-slate-200" />
                <div className="mb-3 h-6 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <p className="text-lg font-medium text-slate-600">No posts yet</p>
            <p className="mt-1 text-slate-500">
              Be the first to share your story.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
