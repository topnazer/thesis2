// File path: ./src/ACAFDashboard.js

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";
import { auth } from "../firebase";

const AcafDashboard = () => {
  const [deanList, setDeanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(""); // Sta
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {

    const fetchUserInfo = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(`${userData.firstName} ${userData.lastName}`);
        }
      }
    };

    const fetchDeans = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/"); // Redirect to login if not authenticated
        return;
      }

      try {
        // Fetch the authenticated user's details
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists() || userDoc.data().role !== "ACAF") {
          navigate("/"); // Redirect if the user is not ACAF
          return;
        }

        // Fetch all deans from the Firestore database
        const deanQuery = query(
          collection(db, "users"),
          where("role", "==", "Dean")
        );

        onSnapshot(deanQuery, (snapshot) => {
          setDeanList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        setLoading(false);
      } catch (err) {
        setError("Failed to fetch deans: " + err.message);
        setLoading(false);
      }
    };
  fetchUserInfo();
    fetchDeans();
  }, [db, navigate]);

  const handleEvaluateDean = (deanId) => {
    navigate(`/evaluate-dean/${deanId}`, {
      state: { redirectTo: "/acaf-dashboard" } // Redirect back to ACAF Dashboard
    });
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
       <nav style={{ display: "flex", justifyContent: "space-between" }}>
      <h1>ACAF Dashboard</h1>
        <div>
          <span>{userName}</span> {/* Display the user's name */}
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      </nav>
      <section>
        <h2>Evaluate Deans</h2>
        <ul>
          {deanList.map((dean) => (
            <li key={dean.id}>
              {dean.firstName} {dean.lastName}
              <button onClick={() => handleEvaluateDean(dean.id)}>Evaluate</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AcafDashboard;
