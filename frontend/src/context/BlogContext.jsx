import { createContext, useContext, useMemo, useState } from 'react';
import { INITIAL_POSTS } from '../data/posts';

const DEMO_EMAIL = 'demo@blog.dev';
const DEMO_PASSWORD = '123456';

// Word count for the "read time" estimate, ignoring HTML tags and image
// placeholders so they don't inflate the count.
function countWords(content) {
  const text = content.replace(/<[^>]*>/g, ' ').replace(/\{\{[^{}]+\}\}/g, ' ');
  return text.split(/\s+/).filter(Boolean).length;
}

const BlogContext = createContext(null);

export function BlogProvider({ children }) {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = (email, password) => {
    if (email.trim() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setIsLoggedIn(true);
      return { ok: true };
    }
    return { ok: false, error: 'Sai email hoặc mật khẩu. Dùng demo@blog.dev / 123456.' };
  };

  const logout = () => setIsLoggedIn(false);

  const addPost = ({ title, tag, excerpt, content, images, coverIndex }) => {
    const words = countWords(content);
    const readTime = Math.max(1, Math.ceil(words / 200)) + ' phút đọc';
    const finalTag = tag.trim() || 'Khác';
    const newId = Math.max(0, ...posts.map((p) => p.id)) + 1;
    const today = new Date();
    const date =
      String(today.getDate()).padStart(2, '0') +
      '/' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '/' +
      today.getFullYear();

    setPosts((prev) => [
      { id: newId, title, tag: finalTag, excerpt, date, readTime, content, images: images || {}, coverIndex },
      ...prev,
    ]);
  };

  const updatePost = (id, { title, tag, excerpt, content, images, coverIndex }) => {
    const words = countWords(content);
    const readTime = Math.max(1, Math.ceil(words / 200)) + ' phút đọc';
    const finalTag = tag.trim() || 'Khác';

    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, title, tag: finalTag, excerpt, content, images: images || {}, readTime, coverIndex }
          : p
      )
    );
  };

  const deletePost = (id) => setPosts((prev) => prev.filter((p) => p.id !== id));

  const value = useMemo(
    () => ({ posts, isLoggedIn, login, logout, addPost, updatePost, deletePost }),
    [posts, isLoggedIn]
  );

  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
}

export function useBlog() {
  const ctx = useContext(BlogContext);
  if (!ctx) throw new Error('useBlog must be used within a BlogProvider');
  return ctx;
}
