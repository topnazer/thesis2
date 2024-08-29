// src/components/StudentDashboard.js
import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const DeanDashboard = () => {
  const [evaluationForm, setEvaluationForm] = useState([]);
  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {
    const fetchEvaluationForm = async () => {
      const evaluationDoc = await getDoc(doc(db, "evaluations", "student"));
      if (evaluationDoc.exists()) {
        setEvaluationForm(evaluationDoc.data().questions);
      }
    };

    fetchEvaluationForm();
  }, [db]);

  const handleEvaluate = () => {
    navigate("/evaluate");
  };
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate("/"); // Redirect to the login page
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };
  return (
    <div>
      <h1>Dean Dashboard</h1>
      <nav>
        <button onClick={handleEvaluate}>Evaluate ??</button>
        <button onClick={handleSignOut}>Sign Out</button>
      </nav>
    </div>
  );
};

export default DeanDashboard;
