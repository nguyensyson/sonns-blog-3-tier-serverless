import { HashRouter, Routes, Route } from 'react-router-dom';
import { BlogProvider } from './context/BlogContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PostDetailPage from './pages/PostDetailPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import JournalPage from './pages/JournalPage';

export default function App() {
  return (
    <BlogProvider>
      <HashRouter>
        <div className="app-shell">
          <div className="glow-left" />
          <div className="glow-right" />
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/post/:id" element={<PostDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/journal" element={<JournalPage />} />
          </Routes>
          <Footer />
        </div>
      </HashRouter>
    </BlogProvider>
  );
}
