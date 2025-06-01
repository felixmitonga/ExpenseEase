import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/firebase';
import './Navbar.css';

function Navbar() {
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">ExpenseTracker</Link>
      </div>
      
      {currentUser ? (
        <div className="navbar-links">
          <Link to="/add-expense">Add Expense</Link>
          <Link to="/expenses">View Expenses</Link>
          <Link to="/reports">Reports</Link>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      ) : (
        <div className="navbar-links">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
