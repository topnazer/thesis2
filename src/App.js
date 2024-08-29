import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./Components/Auth";
import StudentDashboard from "./Components/StudentDashboard";
import FacultyDashboard from "./Components/FacultyDashboard";
import DeanDashboard from "./Components/DeanDashboard";
import AdminDashboard from "./Components/AdminDashboard"; 
import EvaluationForm from "./Components/EvaluationForm";
import EvaluateSubject from './Components/EvaluateSubject';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
        <Route path="/dean-dashboard" element={<DeanDashboard />} />
        <Route path="/evaluate" element={<EvaluationForm />} />
        <Route path="/evaluate-subject/:subjectId" element={<EvaluateSubject />} />
        <Route path="/admin-dashboard/*" element={<AdminDashboard />} /> {/* Admin Route */}
      </Routes>
    </Router>
  );
}

export default App;
