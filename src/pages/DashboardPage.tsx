import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Link, useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { PostWithAuthor } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { PenSquare, Trash2, Pencil, FileText, Loader2, Eye, EyeOff } from 'lucide-react';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, author:profiles(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPosts((data ?? []) as PostWithAuthor[]);
      setLoading(false);
    })();
  }, [user]);

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post permanently?')) return;
    setDeletingId(postId);
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) {
      setPosts(posts.filter((p) => p.id !== postId));
    }
    setDeletingId(null);
  };

  const filtered = posts.filter((p) => {
    if (filter === 'published') return p.published;
    if (filter === 'draft') return !p.published;
    return true;
  });

  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.length - publishedCount;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-200"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-xl font-bold text-slate-600">
              {profile?.username?.[0]?.toUpperCase() ?? 'U'}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {profile?.username ?? 'My'} Dashboard
            </h1>
            <p className="text-sm text-slate-500">{posts.length} posts · {publishedCount} published · {draftCount} drafts</p>
          </div>
        </div>
        <Link
          to="/editor"
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
        >
          <PenSquare className="h-4 w-4" /> New post
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {(['all', 'published', 'draft'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`relative px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              filter === f
                ? 'text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f} ({f === 'all' ? posts.length : f === 'published' ? publishedCount : draftCount})
            {filter === f && (
              <span className="absolute bottom-0 left-0 h-0.5 w-full bg-slate-900" />
            )}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-lg font-medium text-slate-600">No {filter !== 'all' ? filter : ''} posts yet</p>
          <p className="mt-1 text-slate-500">Start writing your first post.</p>
          <Link
            to="/editor"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            <PenSquare className="h-4 w-4" /> Write a post
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  {post.published ? (
                    <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      <Eye className="h-3 w-3" /> Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <EyeOff className="h-3 w-3" /> Draft
                    </span>
                  )}
                  <span className="text-xs text-slate-500">{formatDate(post.created_at)}</span>
                </div>
                <h3
                  className="truncate font-semibold text-slate-900 cursor-pointer hover:text-slate-600"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  {post.title}
                </h3>
                <p className="truncate text-sm text-slate-500">
                  {post.excerpt || post.content.slice(0, 80).replace(/[#*`]/g, '')}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to={`/editor/${post.id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deletingId === post.id}
                  className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  {deletingId === post.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
