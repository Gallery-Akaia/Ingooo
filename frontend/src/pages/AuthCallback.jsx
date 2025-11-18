import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // Get session_id from URL fragment
      const fragment = window.location.hash.substring(1);
      const params = new URLSearchParams(fragment);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        toast.error('Authentication failed');
        navigate('/');
        return;
      }

      try {
        // Exchange session_id for user session
        await axios.post(
          `${API}/auth/session`,
          {},
          {
            headers: { 'X-Session-ID': sessionId },
            withCredentials: true
          }
        );

        toast.success('Successfully logged in!');
        
        // Clean URL and redirect to admin
        window.history.replaceState({}, document.title, '/admin');
        navigate('/admin');
      } catch (error) {
        console.error('Auth error:', error);
        toast.error('Authentication failed');
        navigate('/');
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
        <p className="mt-6 text-gray-400 text-lg">Authenticating...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
