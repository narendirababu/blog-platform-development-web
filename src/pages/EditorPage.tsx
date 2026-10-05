import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import { Link, useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { Post } from '@/lib/types';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

interface EditorPageProps {
  postId?: string;
}

export default function EditorPage({ postId }: EditorPageProps) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!postId;

  useEffect(() => {
    if (!postId) return;
    (async () => {
      const { data, error: err } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle();
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      if (data) {
        const p = data as Post;
        if (user && p.user_id !== user.id) {
          setError('You do not have permission to edit this post.');
          setLoading(false);
          return;
        }
        setTitle(p.title);
        setContent(p.content);
        setExcerpt(p.excerpt ?? '');
        setCoverImageUrl(p.cover_image_url ?? '');
        setPublished(p.published);
      }
      setLoading(false);
    })();
  }, [postId, user]);

  const handleSave = async (e: FormEvent, publish: boolean) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim() || null,
      cover_image_url: coverImageUrl.trim() || null,
      published: publish,
      updated_at: new Date().toISOString(),
    };

    if (isEditing && postId) {
      const { error: err } = await supabase.from('posts').update(payload).eq('id', postId);
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
      navigate(`/post/${postId}`);
    } else {
      const { data, error: err } = await supabase
        .from('posts')
        .insert({ ...payload, user_id: user.id })
        .select('id')
        .single();
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
      navigate(`/post/${data.id}`);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error && isEditing && !title) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg text-slate-600">{error}</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-slate-900 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="mb-8 text-3xl font-bold tracking-tight text-slate-900">
        {isEditing ? 'Edit post' : 'Write a new post'}
      </h1>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form className="space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="An eye-catching title..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-900 outline-none transition-colors focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Excerpt <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="A short summary for the feed..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition-colors focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Cover image URL <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="url"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition-colors focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
          {coverImageUrl && (
            <div className="mt-3 overflow-hidden rounded-xl">
              <img src={coverImageUrl} alt="Cover preview" className="max-h-48 w-full object-cover" />
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            placeholder="Write your story here..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm leading-relaxed text-slate-900 outline-none transition-colors focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 text-sm">
          {published ? (
            <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 font-medium text-green-700">
              <Eye className="h-3.5 w-3.5" /> Published
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
              <EyeOff className="h-3.5 w-3.5" /> Draft
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={(e) => handleSave(e as unknown as FormEvent, false)}
            disabled={saving}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save as draft'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSave(e as unknown as FormEvent, true)}
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? 'Update & publish' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}
