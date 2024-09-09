import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, getDoc, collection, onSnapshot, doc as firestoreDoc } from "firebase/firestore";
import { auth } from "../firebase";
import './studentdashboard.css';

const StudentDashboard = () => {
  const [evaluationForm, setEvaluationForm] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [userName, setUserName] = useState(""); // State for the logged-in user's name

  const navigate = useNavigate();
  const db = getFirestore();

  const fetchUserInfo = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(firestoreDoc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserName(`${userData.firstName} ${userData.lastName}`);
      }
    }
  };

  const fetchEvaluationForm = async () => {
    try {
      const evaluationDoc = await getDoc(firestoreDoc(db, "evaluations", "student"));
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
      if (!user) return;

      const notificationsCollection = collection(db, "notifications", user.uid, "userNotifications");
      onSnapshot(notificationsCollection, (snapshot) => {
        setNotifications(snapshot.docs.map((doc) => doc.data()));
      });
    } catch (error) {
      console.error("Error fetching notifications: ", error);
    }
  };

  const fetchSubjects = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const subjectsCollection = collection(db, "students", user.uid, "subjects");
      onSnapshot(subjectsCollection, async (snapshot) => {
        const fetchedSubjects = await Promise.all(
          snapshot.docs.map(async (document) => {
            const subjectData = { id: document.id, ...document.data() };

            // Fetch faculty details for each subject
            const subjectDoc = await getDoc(firestoreDoc(db, "subjects", subjectData.id));
            if (subjectDoc.exists()) {
              const facultyId = subjectDoc.data().facultyId;
              if (facultyId) {
                const facultyDoc = await getDoc(firestoreDoc(db, "users", facultyId));
                if (facultyDoc.exists()) {
                  subjectData.faculty = facultyDoc.data();
                } else {
                  subjectData.faculty = null;
                }
              } else {
                subjectData.faculty = null;
              }
            } else {
              subjectData.faculty = null;
            }

            return subjectData;
          })
        );

        setSubjects(fetchedSubjects);
      });
    } catch (error) {
      console.error("Error fetching subjects or faculty details:", error);
    }
  };

  useEffect(() => {
    fetchUserInfo();
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
    navigate(`/evaluate-subject/${subjectId}`, {
      state: { redirectTo: "/student-dashboard" }
    });
  };

  return (
    <div>
      <nav style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Student Dashboard</h1>
        <div>
          <span>{userName}</span> {/* Display the user's name */}
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      </nav>

      <section>
        <h2>Subjects</h2>
        {subjects.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Faculty</th>
                <th>Evaluate</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id}>
                  <td>{subject.id}</td>
                  <td>{subject.name}</td>
                  <td>{subject.faculty ? `${subject.faculty.firstName} ${subject.faculty.lastName}` : "No faculty assigned"}</td>
                  <td>
                    <button className="table-evaluate-btn" onClick={() => handleEvaluateSubject(subject.id)}>
                      Evaluate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
