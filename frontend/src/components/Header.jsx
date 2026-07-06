import { useNavigate } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';

export default function Header() {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useBlog();

  const goAdmin = () => navigate(isLoggedIn ? '/admin' : '/login');

  return (
    <div className="header">
      <div className="header-logo" onClick={() => navigate('/')}>
        Sơn<span className="accent">.blog</span>
      </div>
      <div className="header-nav">
        <button className="header-nav-link" onClick={() => navigate('/')}>
          Trang chủ
        </button>
        {isLoggedIn && (
          <button className="header-nav-link" onClick={goAdmin}>
            Quản trị
          </button>
        )}
        {isLoggedIn && (
          <button className="header-nav-link" onClick={() => navigate('/journal')}>
            Nhật ký
          </button>
        )}
        {isLoggedIn ? (
          <button
            className="btn-outline"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Đăng xuất
          </button>
        ) : (
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Đăng nhập
          </button>
        )}
      </div>
    </div>
  );
}
