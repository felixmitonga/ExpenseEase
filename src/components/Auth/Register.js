import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerWithEmailAndPassword } from '../../services/firebase';
import './Auth.css'; // Shared auth styles

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await registerWithEmailAndPassword(name, email, password);
      navigate('/'); // Redirect to home after successful registration
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Create Account</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            minLength="6"
            required
          />
        </div>
        
        <button type="submit" className="btn-primary">
          Register
        </button>
      </form>
      
      <div className="auth-links">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
}

export default Register;