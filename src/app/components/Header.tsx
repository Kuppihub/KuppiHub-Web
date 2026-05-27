'use client';

import { useState } from 'react';
import Link from 'next/link';
import HeaderSearch from './HeaderSearch';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, supabaseUser, loading, signOut } = useAuth();

  // Verified badge component for approved tutors
  const VerifiedBadge = () => (
    <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5 border-2 border-white">
      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </div>
  );

  return (
    <header className="bg-white/15 backdrop-blur-xl border-b border-white/25 text-white sticky top-0 z-50 shadow-sm saturate-150">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <svg
                className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                Kuppi <span className="text-blue-600">Hub</span>
              </span>
            </Link>
          </div>

          <div className="hidden sm:flex flex-1 justify-center px-2">
            <div className="w-full max-w-2xl">
              <HeaderSearch />
            </div>
          </div>

          <div className="hidden sm:flex items-center ml-auto space-x-3">
            <Link 
              href="/dashboard"
              className="px-5 py-2.5 rounded-full font-bold text-blue-900 bg-white/20 border border-white/35 shadow-sm 
                         hover:bg-white/30 hover:text-blue-950 hover:shadow-md hover:border-white/50 hover:scale-105 active:scale-95
                         transition-all duration-300 ease-in-out flex items-center justify-center backdrop-blur-md"
            >
              Dashboard
            </Link>
            <Link 
              href="/tutors"
              className="px-5 py-2.5 rounded-full font-bold text-blue-900 bg-white/20 border border-white/35 shadow-sm 
                         hover:bg-white/30 hover:text-blue-950 hover:shadow-md hover:border-white/50 hover:scale-105 active:scale-95
                         transition-all duration-300 ease-in-out flex items-center justify-center backdrop-blur-md"
            >
              Tutors
            </Link>
            <Link 
              href="/add-kuppi" 
              className="px-5 py-2.5 rounded-full font-bold text-blue-900 bg-white/20 border border-white/35 shadow-sm 
                         hover:bg-white/30 hover:text-blue-950 hover:shadow-md hover:border-white/50 hover:scale-105 active:scale-95
                         transition-all duration-300 ease-in-out flex items-center justify-center backdrop-blur-md"
            >
              Add Kuppi
            </Link>

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="relative">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        width={36}
                        height={36}
                        className="rounded-full border-2 border-white shadow-sm hover:border-blue-400 transition-all cursor-pointer"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-white shadow-sm hover:border-blue-400 transition-all cursor-pointer">
                        {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    {supabaseUser?.is_approved_for_kuppies && <VerifiedBadge />}
                  </div>
                </button>
                
                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsProfileOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {user.displayName || 'User'}
                          </p>
                          {supabaseUser?.is_approved_for_kuppies && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Tutor
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          signOut();
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2.5 rounded-full font-bold text-emerald-900 bg-white/20 border border-white/35 shadow-sm 
                           hover:bg-white/30 hover:text-emerald-950 hover:shadow-md hover:border-white/50 hover:scale-105 active:scale-95
                           transition-all duration-300 ease-in-out flex items-center space-x-2 text-sm backdrop-blur-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden p-2 rounded-md text-blue-800 hover:text-white hover:bg-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>

        {/* Mobile top search bar */}
        <div className="sm:hidden pb-3">
          <HeaderSearch />
        </div>

        {/* Mobile Menu */}
        <div
          className={`sm:hidden bg-white border-t border-gray-500 shadow-xl overflow-hidden transform ease-in-out 
                      transition-all duration-1000
                      ${isMenuOpen ? 'max-h-[1000px] opacity-100 scale-100 delay-0' : 'max-h-0 opacity-0 scale-95 delay-0'}`}
        >
          
          <div className="p-4 space-y-4 transition-opacity duration-500">
            {['Dashboard', 'Tutors', 'Add-Kuppi'].map((item, i) => (
              <Link
                key={i}
                href={`/${item.toLowerCase()}`}
                onClick={() => setIsMenuOpen(false)}
                className="block text-blue-800 font-semibold border border-blue-200 rounded-lg px-4 py-2 
                           hover:bg-blue-600 hover:text-white transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                {item === 'Add-Kuppi' ? 'Add Kuppi' : item}
              </Link>
            ))}

            {/* Placeholder for mobile search (can be added later) */}
               
            <div className="mt-2">
             
              {/* Mobile search component will be added here later */}
            </div>

            {/* Mobile Auth Button */}
            {loading ? (
              <div className="w-full h-10 rounded-lg bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center justify-between border border-red-200 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                        {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    {supabaseUser?.is_approved_for_kuppies && <VerifiedBadge />}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-700 text-sm truncate max-w-[120px]">{user.displayName || user.email}</span>
                      {supabaseUser?.is_approved_for_kuppies && (
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { signOut(); setIsMenuOpen(false); }}
                  className="text-red-600 font-semibold text-sm hover:text-red-800"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center justify-center space-x-2 text-green-700 font-semibold border border-green-200 rounded-lg px-4 py-2 
                           hover:bg-green-600 hover:text-white transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
