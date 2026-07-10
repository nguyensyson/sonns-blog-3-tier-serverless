import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin } from '../api/auth';
import { getMe } from '../api/users';
import { postsApi } from '../api/posts';
import { getErrorMessage } from '../api/client';

const TOKEN_KEY = 'authToken';
const REFRESH_KEY = 'refreshToken';

function mapPost(post) {
  return {
    id: post.postId,
    authorId: post.authorId,
    category: post.category,
    title: post.title,
    tag: post.tag,
    excerpt: post.excerpt,
    content: post.content,
    images: post.images || {},
    coverIndex: post.coverIndex,
    coverImageUrl: post.coverImageUrl || '',
    resources: post.resources || [],
    date: post.date,
    readTime: post.readTime,
    isOwner: post.isOwner,
  };
}

// Uploads any pending data: URLs (freshly picked images still living only in
// the browser) to S3 and swaps them for the returned URL, so the persisted
// post never stores base64 blobs (DynamoDB item size limits, payload size).
async function resolveImages(images) {
  const entries = await Promise.all(
    Object.entries(images || {}).map(async ([placeholder, src]) => {
      if (typeof src !== 'string' || !src.startsWith('data:')) return [placeholder, src];
      const file = dataUrlToFile(src, placeholder);
      const res = await postsApi.uploadImage(file);
      return [placeholder, res.data.url];
    })
  );
  return Object.fromEntries(entries);
}

function dataUrlToFile(dataUrl, filename) {
  const [header, base64] = dataUrl.split(',');
  const mime = /data:(.*?);base64/.exec(header)?.[1] || 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

function toApiBody({ title, tag, excerpt, content, images, coverIndex, coverImageUrl, resources, date }) {
  return {
    title,
    tag: (tag || '').trim(),
    excerpt,
    content,
    images: images || {},
    coverIndex,
    coverImageUrl: coverImageUrl || null,
    resources: resources || [],
    date,
  };
}

// Mirrors resolveImages() above but for the single cover-image field: if the
// user just picked a new file it's still a data: URL in form state, so it
// needs to be uploaded to S3 before the post is saved.
async function resolveCoverImage(coverImageUrl) {
  if (typeof coverImageUrl !== 'string' || !coverImageUrl.startsWith('data:')) return coverImageUrl;
  const file = dataUrlToFile(coverImageUrl, 'cover');
  const res = await postsApi.uploadImage(file);
  return res.data.url;
}

// Newly picked resource files (CSV etc.) are kept as real File objects in
// form.resourceFiles while pending (never base64-encoded — they can be much
// larger than an inline image) and only uploaded to S3 at submit time, then
// appended to the already-persisted form.resources list.
async function resolveResources({ resources, resourceFiles }) {
  const uploaded = await Promise.all(
    (resourceFiles || []).map(async (file) => {
      const res = await postsApi.uploadResource(file);
      return { url: res.data.url, name: res.data.name };
    })
  );
  return [...(resources || []), ...uploaded];
}

const BlogContext = createContext(null);

export function BlogProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [blogPosts, setBlogPosts] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [isBlogLoading, setIsBlogLoading] = useState(true);
  const [blogError, setBlogError] = useState('');
  const [isJournalLoading, setIsJournalLoading] = useState(false);
  const [journalError, setJournalError] = useState('');

  const loadBlogPosts = useCallback(async () => {
    const res = await postsApi.listBlog();
    setBlogPosts(res.data.items.map(mapPost));
  }, []);

  const loadJournalEntries = useCallback(async () => {
    const res = await postsApi.listDiary();
    setJournalEntries(res.data.items.map(mapPost));
  }, []);

  const fetchBlogPosts = useCallback(() => {
    setIsBlogLoading(true);
    setBlogError('');
    return loadBlogPosts()
      .catch((err) => setBlogError(getErrorMessage(err)))
      .finally(() => setIsBlogLoading(false));
  }, [loadBlogPosts]);

  const fetchJournalEntries = useCallback(() => {
    setIsJournalLoading(true);
    setJournalError('');
    return loadJournalEntries()
      .catch((err) => setJournalError(getErrorMessage(err)))
      .finally(() => setIsJournalLoading(false));
  }, [loadJournalEntries]);

  useEffect(() => {
    fetchBlogPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validate any token left over from a previous session before trusting it -
  // it may have expired since the last visit.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setAuthChecked(true);
      return;
    }
    getMe()
      .then(() => setIsLoggedIn(true))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
      })
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setJournalEntries([]);
      setJournalError('');
      return;
    }
    fetchJournalEntries();
  }, [isLoggedIn, fetchJournalEntries]);

  const login = async (email, password) => {
    try {
      const res = await apiLogin(email.trim(), password);
      localStorage.setItem(TOKEN_KEY, res.data.accessToken);
      localStorage.setItem(REFRESH_KEY, res.data.refreshToken);
      setIsLoggedIn(true);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setIsLoggedIn(false);
  };

  const resolveCategory = (id, payloadCategory) => {
    if (payloadCategory === 'journal' || payloadCategory === 'blog') return payloadCategory;
    return journalEntries.some((p) => p.id === id) ? 'journal' : 'blog';
  };

  const addPost = async ({ category, ...form }) => {
    const finalCategory = category === 'journal' ? 'journal' : 'blog';
    const body = toApiBody(form);
    body.images = await resolveImages(body.images);
    body.coverImageUrl = await resolveCoverImage(body.coverImageUrl);
    body.resources = await resolveResources(form);
    if (finalCategory === 'journal') {
      await postsApi.createDiary(body);
      await loadJournalEntries();
    } else {
      await postsApi.createBlog(body);
      await loadBlogPosts();
    }
  };

  const updatePost = async (id, { category, ...form }) => {
    const finalCategory = resolveCategory(id, category);
    const body = toApiBody(form);
    body.images = await resolveImages(body.images);
    body.coverImageUrl = await resolveCoverImage(body.coverImageUrl);
    body.resources = await resolveResources(form);
    if (finalCategory === 'journal') {
      await postsApi.updateDiary(id, body);
      await loadJournalEntries();
    } else {
      await postsApi.updateBlog(id, body);
      await loadBlogPosts();
    }
  };

  const deletePost = async (id, category) => {
    const finalCategory = resolveCategory(id, category);
    if (finalCategory === 'journal') {
      await postsApi.deleteDiary(id);
      setJournalEntries((prev) => prev.filter((p) => p.id !== id));
    } else {
      await postsApi.deleteBlog(id);
      setBlogPosts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const value = useMemo(
    () => ({
      blogPosts,
      journalEntries,
      isBlogLoading,
      blogError,
      isJournalLoading,
      journalError,
      retryLoadBlogPosts: fetchBlogPosts,
      retryLoadJournalEntries: fetchJournalEntries,
      isLoggedIn,
      authChecked,
      login,
      logout,
      addPost,
      updatePost,
      deletePost,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blogPosts, journalEntries, isBlogLoading, blogError, isJournalLoading, journalError, isLoggedIn, authChecked]
  );

  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
}

export function useBlog() {
  const ctx = useContext(BlogContext);
  if (!ctx) throw new Error('useBlog must be used within a BlogProvider');
  return ctx;
}
