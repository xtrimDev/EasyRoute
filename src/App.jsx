import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';
import Signup from './components/Signup';
import MapApp from './components/MapApp';
import Navbar from './components/Navbar';

const App = () => {
  const [user, setUser] = useState(null);
  const [showSignup, setShowSignup] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSwitchAuthMode = () => setShowSignup((prev) => !prev);
  const handleLogout = () => signOut(auth);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-50">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onSwitchAuthMode={handleSwitchAuthMode}
        showSignup={showSignup}
      />
      {routeInfo && (
        <div className="w-full fixed top-[64px] left-0 z-40 pointer-events-none">
          <div
            className="flex items-center gap-6 px-8 py-3 ml-12 mt-8 rounded-2xl shadow-xl border border-blue-200 bg-white pointer-events-auto transition hover:shadow-2xl"
            style={{
              color: '#1e3a8a',
              fontWeight: 500,
              fontSize: '1.08rem',
              letterSpacing: '0.01em',
              width: '17%',
            }}
          >
            <span className="flex flex-col items-start gap-1">
              <span className="flex items-center gap-2 text-blue-600 text-lg font-bold">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9zm0-4v-4m0 0V7m0 4h4m-4 0H8"/></svg>
                {routeInfo.distance.toFixed(2)} km
              </span>
              <span className="text-xs text-gray-500 font-normal">Distance</span>
            </span>
            <span className="flex flex-col items-start gap-1">
              <span className="flex items-center gap-2 text-blue-600 text-lg font-bold">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3"/></svg>
                {routeInfo.time} min
              </span>
              <span className="text-xs text-gray-500 font-normal">Estimated Time</span>
            </span>
          </div>
        </div>
      )}
      <div className="pt-20 h-full w-full">
        {!user ? (
          showSignup ? (
            <>
              <Signup onSignup={handleSwitchAuthMode} />
              <p className="text-center mt-2">Already have an account? <button className="text-blue-500" onClick={handleSwitchAuthMode}>Login</button></p>
            </>
          ) : (
            <>
              <Login onLogin={() => {}} />
              <p className="text-center mt-2">Don't have an account? <button className="text-blue-500" onClick={handleSwitchAuthMode}>Sign Up</button></p>
            </>
          )
        ) : (
          <MapApp routeInfo={routeInfo} setRouteInfo={setRouteInfo} />
        )}
      </div>
    </div>
  );
};

export default App;