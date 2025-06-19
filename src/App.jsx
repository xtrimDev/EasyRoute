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
          <MapApp />
        )}
      </div>
    </div>
  );
};

export default App;