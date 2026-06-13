import React, { useState } from 'react';
import { fetchWithAuth } from '../api';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isRegister) {
        const res = await fetchWithAuth('/auth/register', {
          method: 'POST',
          body: JSON.stringify(form)
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.detail || 'Registration failed');
        }
        setIsRegister(false);
        alert('Registration successful. Please login.');
      } else {
        const res = await fetchWithAuth('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: form.email, password: form.password, name: "login" })
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.detail || 'Login failed');
        }
        const data = await res.json();
        localStorage.setItem('access_token', data.access_token);
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h2 className="mb-6 text-3xl font-light text-primary text-center">
          SkillSync<span className="font-bold">AI</span>
        </h2>
        
        {error && <div className="mb-4 rounded bg-red-900/50 p-3 text-sm text-red-200 border border-red-800">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Name</label>
              <input 
                type="text" 
                required 
                className="w-full rounded-md border border-border bg-background p-2 text-primary focus:border-primary focus:outline-none"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Email</label>
            <input 
              type="email" 
              required 
              className="w-full rounded-md border border-border bg-background p-2 text-primary focus:border-primary focus:outline-none"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Password</label>
            <input 
              type="password" 
              required 
              className="w-full rounded-md border border-border bg-background p-2 text-primary focus:border-primary focus:outline-none"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
            />
          </div>
          
          <button type="submit" className="w-full rounded-md bg-primary py-2 font-medium text-background transition-transform hover:scale-105 active:scale-95">
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-secondary">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsRegister(!isRegister)} className="text-primary hover:underline font-medium">
            {isRegister ? 'Login here' : 'Register here'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
