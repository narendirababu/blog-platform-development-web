import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import { Link, useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { PostWithAuthor, CommentWithAuthor } from '@/lib/types';
import { formatDate, formatRelative } from '@/lib/format';
import {
  ArrowLeft,
  Trash2,
  Pencil,
  MessageCircle,
  Loader2,
  Send,
  Clock,
} from 'lucide-react';

interface PostDetailPageProps {
  post: PostWithAuthor;
  comments: CommentWithAuthor[];
  loading: boolean;
}

export default function PostDetailPage({ post, comments, loading }: PostDetailPageProps) {
  const { user, profile } = useAuth();
  const { navigate } = useRouter();
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [localComments, setLocalComments] = useState<CommentWithAuthor[]>(comments);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const isAuthor = user?.id === post.user_id;

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    setSubmitting(true);
    setCommentError('');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: post.id,
        content: commentText.trim(),
        user_id: user.id,
      })
      .select('*, author:profiles(*)')
      .single();

    if (error) {
      setCommentError(error.message);
      setSubmitting(false);
      return;
    }

    setLocalComments([...localComments, data as CommentWithAuthor]);
    setCommentText('');
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingId(commentId);
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) {
      setLocalComments(localComments.filter((c) => c.id !== commentId));
    }
    setDeletingId(null);
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (!error) navigate('/');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </Link>

      <article>
        {/* Author row */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {post.author?.avatar_url ? (
              <img
                src={post.author.avatar_url}
                alt={post.author.username}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-200"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                {post.author?.username?.[0]?.toUpperCase() ?? 'A'}
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-900">{post.author?.username ?? 'Unknown'}</p>
              <p className="text-sm text-slate-500">
                {formatDate(post.created_at)} · {timeToRead(post.content)} read
              </p>
            </div>
          </div>
          {isAuthor && (
            <div className="flex items-center gap-2">
              <Link
                to={`/editor/${post.id}`}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
              <button
                onClick={handleDeletePost}
                className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          {post.title}
        </h1>

        {/* Cover image */}
        {post.cover_image_url && (
          <div className="mb-8 overflow-hidden rounded-2xl">
            <img
              src={post.cover_image_url}
              alt=""
              className="w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-slate prose-lg max-w-none whitespace-pre-wrap text-slate-700">
          {post.content}
        </div>
      </article>

      {/* Comments section */}
      <section className="mt-16 border-t border-slate-200 pt-8">
        <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-900">
          <MessageCircle className="h-5 w-5" />
          Comments ({localComments.length})
        </h2>

        {/* Comment form */}
        {user ? (
          <form onSubmit={handleAddComment} className="mb-8">
            {commentError && (
              <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                {commentError}
              </p>
            )}
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                {profile?.username?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  placeholder="Share your thoughts..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition-colors focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !commentText.trim()}
                    className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Post comment
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-center">
            <p className="text-slate-600">
              <Link to="/login" className="font-semibold text-slate-900 hover:underline">
                Sign in
              </Link>{' '}
              to join the conversation.
            </p>
          </div>
        )}

        {/* Comment list */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : localComments.length === 0 ? (
          <p className="py-8 text-center text-slate-500">No comments yet. Be the first to respond.</p>
        ) : (
          <div className="space-y-5">
            {localComments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                {comment.author?.avatar_url ? (
                  <img
                    src={comment.author.avatar_url}
                    alt={comment.author.username}
                    className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-200"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                    {comment.author?.username?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                )}
                <div className="flex-1">
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {comment.author?.username ?? 'Unknown'}
                      </span>
                      <span className="text-xs text-slate-500">{formatRelative(comment.created_at)}</span>
                      {user?.id === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingId === comment.id}
                          className="ml-auto text-slate-400 transition-colors hover:text-red-600"
                          aria-label="Delete comment"
                        >
                          {deletingId === comment.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-700">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function timeToRead(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min`;
}
