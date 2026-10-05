import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { RouterProvider, useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import type { PostWithAuthor, CommentWithAuthor } from '@/lib/types';
import Navbar from '@/components/Navbar';
import HomePage from '@/pages/HomePage';
import PostDetailPage from '@/pages/PostDetailPage';
import EditorPage from '@/pages/EditorPage';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import { Link } from '@/lib/router';
import { Loader2 } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-slate-200">404</p>
      <p className="mt-2 text-lg text-slate-600">Page not found</p>
      <Link to="/" className="mt-4 font-semibold text-slate-900 hover:underline">
        Back to home
      </Link>
    </div>
  );
}

function HomeRoute() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('posts')
        .select('*, author:profiles(*)')
        .eq('published', true)
        .order('created_at', { ascending: false });
      setPosts((data ?? []) as PostWithAuthor[]);
      setPostsLoading(false);
    })();
  }, []);

  return <HomePage posts={posts} loading={postsLoading} />;
}

function PostDetailRoute({ postId }: { postId: string }) {
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: postData } = await supabase
        .from('posts')
        .select('*, author:profiles(*)')
        .eq('id', postId)
        .maybeSingle();

      if (!postData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPost(postData as PostWithAuthor);

      const { data: commentData } = await supabase
        .from('comments')
        .select('*, author:profiles(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      setComments((commentData ?? []) as CommentWithAuthor[]);
      setLoading(false);
    })();
  }, [postId]);

  if (loading) return <LoadingScreen />;
  if (notFound || !post) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-medium text-slate-600">Post not found</p>
        <Link to="/" className="mt-4 font-semibold text-slate-900 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return <PostDetailPage post={post} comments={comments} loading={false} />;
}

function Routes() {
  const { path, navigate } = useRouter();
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  // Home / feed
  if (path === '/' || path === '') {
    return <HomeRoute />;
  }

  // Login
  if (path === '/login') {
    if (user) {
      navigate('/');
      return <LoadingScreen />;
    }
    return <LoginPage />;
  }

  // Register
  if (path === '/register') {
    if (user) {
      navigate('/');
      return <LoadingScreen />;
    }
    return <RegisterPage />;
  }

  // Dashboard (protected)
  if (path === '/dashboard') {
    if (!user) {
      navigate('/login');
      return <LoadingScreen />;
    }
    return <DashboardPage />;
  }

  // Editor (protected)
  if (path === '/editor' || path.startsWith('/editor/')) {
    if (!user) {
      navigate('/login');
      return <LoadingScreen />;
    }
    const editId = path.startsWith('/editor/') ? path.split('/')[2] : undefined;
    return <EditorPage postId={editId} />;
  }

  // Post detail
  if (path.startsWith('/post/')) {
    const postId = path.split('/')[2];
    return <PostDetailRoute postId={postId} />;
  }

  return <NotFound />;
}

function AppInner() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <Navbar />
      <main>
        <Routes />
      </main>
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
          <p className="text-sm text-slate-500">Inkwell — share your stories.</p>
          <p className="text-sm text-slate-400">Built with Supabase</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppInner />
      </RouterProvider>
    </AuthProvider>
  );
}
