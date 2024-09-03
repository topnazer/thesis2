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
import './Admin.css';


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

    <div className="whole-container">
      <div className="Admin-navbar">
        <div className="Admin-name">
        <h2>Admin Dashboard</h2>
        </div>
        <div className="Admin-links">
          <Link to="users">User</Link>
          <Link to="evaluation-tools">Evaluation Tools</Link>
          <Link to="notifications">Notifications</Link>
          <Link to="subjects">Subjects</Link>
        </div>
      </div>
      <div className="main-container">
          <div className="Admin-header">
            <p>Welcome, Admin! Here you can manage users, evaluation forms, and more.</p>
          </div>
            <div className="route-containers">
              <Routes>
                <Route path="users" element={<UsersPage />} />
                <Route path="evaluation-tools" element={<EvaluationToolsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="subjects" element={<Subjects />} />
                <Route path="evaluate-subject/:subjectId" element={<EvaluateSubject />} />
              </Routes>
            </div>  
      </div>
    </div>
  );
};

export default AdminDashboard;
