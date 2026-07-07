import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';

export default function LoginPage() {
  const { login } = useBlog();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);
    if (result.ok) {
      setError('');
      navigate('/admin');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h2 className="login-title">Đăng nhập quản trị</h2>
        <form className="form-col" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="text-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            className="text-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
