// File path: ./src/FacultyDashboard.js

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, getDoc, collection, onSnapshot, doc } from "firebase/firestore";
import { auth } from "../firebase";

const FacultyDashboard = () => {
  const [evaluationForm, setEvaluationForm] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [subjects, setSubjects] = useState([]); // Add subjects state to store assigned subjects
  
  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {
    const fetchEvaluationForm = async () => {
      const evaluationDoc = await getDoc(doc(db, "evaluations", "faculty"));
      if (evaluationDoc.exists()) {
        setEvaluationForm(evaluationDoc.data().questions);
      } else {
        console.error("No evaluation form found for faculty.");
      }
    };

    const fetchNotifications = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.error("User is not authenticated");
        return;
      }
      const notificationsCollection = collection(db, "notifications", user.uid, "userNotifications");
      onSnapshot(notificationsCollection, (snapshot) => {
        setNotifications(snapshot.docs.map(doc => doc.data()));
      });
    };

    const fetchSubjects = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const subjectsCollection = collection(db, "faculty", user.uid, "subjects");
      onSnapshot(subjectsCollection, (snapshot) => {
        setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    };

    fetchSubjects();
  }, [db]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleEvaluateSubject = (subjectId) => {
    navigate(`/evaluate-subject/${subjectId}`);
  };


  return (
    <div>
      <h1>Faculty Dashboard</h1>
      <nav>
    
        <button onClick={handleSignOut}>Sign Out</button>
      </nav>

      <section>
        <h2>Subjects</h2>
        <ul>
          {subjects.map((subject) => (
            <li key={subject.id}>
              {subject.name}
              <button onClick={() => handleEvaluateSubject(subject.id)}>Evaluate</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Notifications</h2>
        <ul>
          {notifications.map((notification, index) => (
            <li key={index}>{notification.message}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default FacultyDashboard;
