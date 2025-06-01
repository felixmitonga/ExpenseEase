import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import AddExpense from './components/Expense/AddExpense';
import ExpenseList from './components/Expense/ExpenseList';
import ReportGenerator from './components/Reports/ReportGenerator';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <div className="content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/add-expense" element={<PrivateRoute><AddExpense /></PrivateRoute>} />
              <Route path="/expenses" element={<PrivateRoute><ExpenseList /></PrivateRoute>} />
              <Route path="/reports" element={<PrivateRoute><ReportGenerator /></PrivateRoute>} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

export default App;

