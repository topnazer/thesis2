import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { auth } from "../firebase";

const AcafDashboard = () => {
  const [evaluationForm, setEvaluationForm] = useState([]);
  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {
    const fetchEvaluationForm = async () => {
      const evaluationDoc = await getDoc(doc(db, "evaluations", "acaf"));
      if (evaluationDoc.exists()) {
        setEvaluationForm(evaluationDoc.data().questions);
      } else {
        console.error("No evaluation form found for acaf.");
      }
    };

    fetchEvaluationForm();
  }, [db]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate("/"); // Redirect to the login page
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleEvaluate = () => {
    console.log("Navigating to evaluate dean...");
    navigate("/evaluate", { state: { evaluatedRole: "dean" } });
  };


  return (
    <div>
      <h1>acaf Dashboard</h1>
      <nav>
        <button onClick={handleEvaluate}>Evaluate dean</button>
        <button onClick={handleSignOut}>Sign Out</button>
      </nav>
    </div>
  );
};

export default AcafDashboard;
