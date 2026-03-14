'use client';
import ThreeDModel from '../components/ThreeDModel';
import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import Preloader from '../components/Preloader';

export default function Contact() {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitStatus, setSubmitStatus] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
    };
    (window as any).onTurnstileExpire = () => {
      setTurnstileToken('');
    };
    (window as any).onTurnstileError = () => {
      setTurnstileToken('');
    };

    return () => {
      delete (window as any).onTurnstileSuccess;
      delete (window as any).onTurnstileExpire;
      delete (window as any).onTurnstileError;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      setSubmitStatus('Please complete the verification.');
      setErrorDialogMessage('Please complete the verification.');
      setShowErrorDialog(true);
      return;
    }

    setSubmitStatus('Submitting...');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, turnstileToken }),
      });

      const result = await res.json();

      if (res.ok) {
        setSubmitStatus('Message sent successfully!');
        setShowSuccessDialog(true);
        setFormData({ name: '', email: '', message: '' });
        setTurnstileToken('');
      } else {
        setSubmitStatus(result.error || 'Failed to send message');
        setErrorDialogMessage(result.error || 'Failed to send message');
        setShowErrorDialog(true);
      }
    } catch (error) {
      setSubmitStatus('Error sending message');
      setErrorDialogMessage('Error sending message');
      setShowErrorDialog(true);
      console.error(error);
    }
  };

  if (loading) return <Preloader />;

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4">
          Contact Us
        </h2>
       <p className="text-gray-600 mb-8 sm:mb-10 text-base sm:text-lg">
  Got a question or feedback? We&apos;d love to hear from you.
</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {/* Contact Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <div
              className="cf-turnstile"
              data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              data-callback="onTurnstileSuccess"
              data-expired-callback="onTurnstileExpire"
              data-error-callback="onTurnstileError"
            ></div>
            <div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition"
              >
                Send Message
              </button>
            </div>
            {submitStatus && <p className="mt-2 text-sm text-gray-700">{submitStatus}</p>}
          </form>

          {/* 3D Model */}
          <div className="w-full h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
            <ThreeDModel />
          </div>
        </div>
      </div>
      {showSuccessDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              ✓
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Success</h3>
            <p className="mt-2 text-sm text-gray-600">
              {submitStatus || 'Message sent successfully!'}
            </p>
            <button
              onClick={() => setShowSuccessDialog(false)}
              className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showErrorDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              !
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Error</h3>
            <p className="mt-2 text-sm text-gray-600">
              {errorDialogMessage || 'Failed to send message'}
            </p>
            <button
              onClick={() => setShowErrorDialog(false)}
              className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
