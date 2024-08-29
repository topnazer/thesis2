// File path: ./src/AdminDashboard.js

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Route, Routes, Link } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { auth } from "../firebase";
import UsersPage from "./UsersPage";
import EvaluationToolsPage from "./EvaluationToolsPage";
import NotificationsPage from "./NotificationsPage";
import Subjects from "./Subjects";
import EvaluateSubject from "./EvaluateSubject";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const db = getFirestore();
  const navigate = useNavigate();

  const fetchSubjects = useCallback(async () => {
    // Your existing logic here
  }, [db]);

  useEffect(() => {
    const checkAdminRole = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role === "Admin") {
        setIsAdmin(true);
        await fetchSubjects();
      } else {
        navigate("/");
      }
      setLoading(false);
    };
    checkAdminRole();
  }, [navigate, fetchSubjects]);

  if (loading) return <p>Loading...</p>;
  if (!isAdmin) return <p>Access Denied</p>;

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
