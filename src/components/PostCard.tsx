import { Link } from '@/lib/router';
import type { PostWithAuthor } from '@/lib/types';
import { formatDate, timeToRead } from '@/lib/format';
import { MessageCircle, Clock } from 'lucide-react';

interface PostCardProps {
  post: PostWithAuthor;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link
      to={`/post/${post.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {post.cover_image_url ? (
        <div className="h-48 overflow-hidden">
          <img
            src={post.cover_image_url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
          <span className="text-3xl font-bold text-slate-300">
            {post.title.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
            {post.author?.username?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <span className="text-sm font-medium text-slate-700">
            {post.author?.username ?? 'Unknown'}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-sm text-slate-500">{formatDate(post.created_at)}</span>
        </div>

        <h3 className="mb-2 text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-slate-600">
          {post.title}
        </h3>

        <p className="mb-4 line-clamp-2 text-sm text-slate-600">
          {post.excerpt || post.content.slice(0, 120).replace(/[#*`]/g, '')}
        </p>

        <div className="mt-auto flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {timeToRead(post.content)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" /> 0 comments
          </span>
        </div>
      </div>
    </Link>
  );
}
