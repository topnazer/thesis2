// File path: ./src/StudentDashboard.js

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, getDoc, collection, onSnapshot, doc, query, where } from "firebase/firestore";
import { auth } from "../firebase";

const StudentDashboard = () => {
  const [facultyToEvaluate, setFacultyToEvaluate] = useState([]);
  const [evaluationForm, setEvaluationForm] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {
    const fetchEvaluationForm = async () => {
      try {
        const evaluationDoc = await getDoc(doc(db, "evaluations", "student"));
        if (evaluationDoc.exists()) {
          setEvaluationForm(evaluationDoc.data().questions);
        } else {
          console.error("No evaluation form found for student.");
        }
      } catch (error) {
        console.error("Error fetching evaluation form: ", error);
      }
    };

    const fetchNotifications = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("User is not authenticated");
          return;
        }
        const notificationsCollection = collection(db, "notifications", user.uid, "userNotifications");
        onSnapshot(notificationsCollection, (snapshot) => {
          setNotifications(snapshot.docs.map(doc => doc.data()));
        });
      } catch (error) {
        console.error("Error fetching notifications: ", error);
      }
    };

    const fetchSubjects = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.error("User is not authenticated");
        return;
      }

      try {
        const subjectsCollection = collection(db, "students", user.uid, "subjects");
        onSnapshot(subjectsCollection, (snapshot) => {
          const fetchedSubjects = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setSubjects(fetchedSubjects);
        });
      } catch (error) {
        console.error("Error fetching subjects: ", error);
      }
    };

    fetchEvaluationForm();
    fetchNotifications();
    fetchSubjects();
  }, [db, navigate]);

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
      <h1>Student Dashboard</h1>
      <nav>
        <button onClick={handleSignOut}>Sign Out</button>
      </nav>

      <section>
        <h2>Subjects</h2>
        {subjects.length > 0 ? (
          <ul>
            {subjects.map((subject) => (
              <li key={subject.id}>
                {subject.name}
                <button onClick={() => handleEvaluateSubject(subject.id)}>Evaluate</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No subjects available</p>
        )}
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

export default StudentDashboard;
