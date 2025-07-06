import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
// import axiosInstance from '../../services/axiosInstance'; // To be created

// Dummy list of allowed domains - in a real app, this would come from an API or config
const ALLOWED_DOMAINS = ['example.com', 'school.edu', 'gov.org']; // Example domains

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateDomain = (email: string): boolean => {
    const domain = email.split('@')[1];
    return ALLOWED_DOMAINS.includes(domain);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!validateDomain(email)) {
      setError('Email domain is not allowed. Please use an email from an approved organization.');
      return;
    }

    setLoading(true);

    try {
      // const response = await axiosInstance.post('/auth/register', { name, email, password });
      // setSuccessMessage(response.data.message || 'Registration successful! Please check your email to verify your account.');
      // setTimeout(() => navigate('/login'), 3000); // Redirect after a delay

      // Placeholder logic until API is connected
      console.log('Registering user:', { name, email, password });
      setSuccessMessage('Registration successful! Please check your email to verify your account. (This is a mock response)');
      // Reset form or redirect
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      // In a real scenario, you might not redirect immediately but show the success message.
      // Or redirect to an email verification pending page.
      // For now, just clear form and show message.

    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {successMessage && <p className="text-green-500 text-center mb-4">{successMessage}</p>}
        {!successMessage && ( // Hide form on success for this example
          <form onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
            <Input
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Button type="submit" variant="primary" className="w-full mt-4" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
        )}
        <p className="text-center mt-4 text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
