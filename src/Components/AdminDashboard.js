import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Route, Routes, Link } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth"; // Import directly from firebase/auth
import UsersPage from "./UsersPage";
import EvaluationToolsPage from "./EvaluationToolsPage";
import NotificationsPage from "./NotificationsPage";
import Subjects from "./Subjects";
import EvaluateSubject from "./EvaluateSubject";

const AdminDashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const db = getFirestore();
  const navigate = useNavigate();

  const fetchSubjects = useCallback(async () => {
    // Your existing logic here
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "Admin") {
          setIsAdmin(true);
          await fetchSubjects();
        } else {
          navigate("/");
        }
      } else {
        navigate("/");
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [navigate, fetchSubjects, db]);

  if (!isAdmin) return <p>tagad ha</p>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <nav>
        <ul>
          <li><Link to="users">Users</Link></li>
          <li><Link to="evaluation-tools">Evaluation Tools</Link></li>
          <li><Link to="notifications">Notifications</Link></li>
          <li><Link to="subjects">Subjects</Link></li>
        </ul>
      </nav>
      <Routes>
        <Route path="users" element={<UsersPage />} />
        <Route path="evaluation-tools" element={<EvaluationToolsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="evaluate-subject/:subjectId" element={<EvaluateSubject />} />
      </Routes>
    </div>
  );
};

export default AdminDashboard;
