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

  const addPost = ({ title, tag, excerpt, content, images, coverIndex, category, date }) => {
    const finalCategory = category === 'journal' ? 'journal' : 'blog';
    const finalTag = tag.trim() || 'Khác';
    const newId = Math.max(0, ...posts.map((p) => p.id)) + 1;
    const today = new Date();
    const todayLabel =
      String(today.getDate()).padStart(2, '0') +
      '/' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '/' +
      today.getFullYear();

    const finalDate = finalCategory === 'journal' ? (date || '').trim() || todayLabel : todayLabel;
    const words = countWords(content);
    const readTime = Math.max(1, Math.ceil(words / 200)) + ' phút đọc';

    setPosts((prev) => [
      {
        id: newId,
        category: finalCategory,
        title,
        tag: finalTag,
        excerpt,
        date: finalDate,
        readTime,
        content,
        images: images || {},
        coverIndex,
      },
      ...prev,
    ]);
  };

  const updatePost = (id, { title, tag, excerpt, content, images, coverIndex, category, date }) => {
    const finalCategory = category === 'journal' ? 'journal' : 'blog';
    const finalTag = tag.trim() || 'Khác';
    const words = countWords(content);
    const readTime = Math.max(1, Math.ceil(words / 200)) + ' phút đọc';

    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              category: finalCategory,
              title,
              tag: finalTag,
              excerpt,
              content,
              images: images || {},
              readTime,
              coverIndex,
              date: finalCategory === 'journal' ? (date || '').trim() || p.date : p.date,
            }
          : p
      )
    );
  };

  const deletePost = (id) => setPosts((prev) => prev.filter((p) => p.id !== id));

  const blogPosts = useMemo(() => posts.filter((p) => (p.category || 'blog') === 'blog'), [posts]);
  const journalEntries = useMemo(() => posts.filter((p) => p.category === 'journal'), [posts]);

  const value = useMemo(
    () => ({ posts, blogPosts, journalEntries, isLoggedIn, login, logout, addPost, updatePost, deletePost }),
    [posts, blogPosts, journalEntries, isLoggedIn]
  );

  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
}

export function useBlog() {
  const ctx = useContext(BlogContext);
  if (!ctx) throw new Error('useBlog must be used within a BlogProvider');
  return ctx;
}
