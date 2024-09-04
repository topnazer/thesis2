import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc, collection, onSnapshot, query, where } from "firebase/firestore";
import { auth } from "../firebase";

const FacultyDashboard = () => {
  const [evaluationForm, setEvaluationForm] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [deanList, setDeanList] = useState([]);
  const [averageScore, setAverageScore] = useState(null);
  const [userName, setUserName] = useState(""); // State for the logged-in user's name

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
      if (!user) return;

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

    const fetchFacultyInDepartment = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const department = userDoc.data().department;

        const facultyQuery = query(
          collection(db, "users"),
          where("department", "==", department),
          where("role", "==", "Faculty")
        );

        onSnapshot(facultyQuery, (snapshot) => {
          setFacultyList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
      }
    };

    const fetchDeansInDepartment = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const department = userDoc.data().department;

        const deanQuery = query(
          collection(db, "users"),
          where("department", "==", department),
          where("role", "==", "Dean")
        );

        onSnapshot(deanQuery, (snapshot) => {
          setDeanList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
      }
    };

    const fetchAverageScore = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const facultyEvaluationDoc = await getDoc(doc(db, "facultyEvaluations", user.uid));
      if (facultyEvaluationDoc.exists()) {
        setAverageScore(facultyEvaluationDoc.data().averageScore);
      } else {
        console.error("No average score found for this faculty.");
      }
    };

    fetchUserInfo();
    fetchEvaluationForm();
    fetchNotifications();
    fetchSubjects();
    fetchFacultyInDepartment();
    fetchAverageScore();
    fetchDeansInDepartment();
  }, [db]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleEvaluateFaculty = (facultyId) => {
    navigate(`/evaluate-faculty/${facultyId}`, {
      state: { redirectTo: "/faculty-dashboard" }
    });
  };

  return (
    <div>
      <nav style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Faculty Dashboard</h1>
        <div>
          <span>{userName}</span> {/* Display the user's name */}
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      </nav>

      <section>
        <h2>Notifications</h2>
        <ul>
          {notifications.map((notification, index) => (
            <li key={index}>{notification.message}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Evaluate Faculty</h2>
        <ul>
          {facultyList.map((faculty) => (
            <li key={faculty.id}>
              {faculty.firstName} {faculty.lastName}
              <button onClick={() => handleEvaluateFaculty(faculty.id)}>Evaluate</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Evaluate Dean</h2>
        <ul>
          {deanList.map((dean) => (
            <li key={dean.id}>
              {dean.firstName} {dean.lastName}
              <button onClick={() => navigate(`/evaluate-dean/${dean.id}`, { state: { redirectTo: "/faculty-dashboard" } })}>
                Evaluate
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Evaluation Report</h2>
        {averageScore !== null ? (
          <p>Your average score: {averageScore.toFixed(2)}</p>
        ) : (
          <p>No evaluations submitted yet.</p>
        )}
      </section>
    </div>
  );
};

export default FacultyDashboard;
