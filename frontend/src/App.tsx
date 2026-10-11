import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import FamilyReport from "./pages/FamilyReport";
import Search from "./pages/Search";
import AuthorityDashboard from "./pages/AuthorityDashboard";
import AuthorityLogin from "./pages/AuthorityLogin";
import AuthorityRegister from "./pages/AuthorityRegister";
import ResponderRegister from "./pages/ResponderRegister";
import MatchReview from "./pages/MatchReview";
import CaseDetails from "./pages/CaseDetails";
import LoginSelection from "./pages/LoginSelection";
import FamilyDashboard from "./pages/FamilyDashboard";
import { isAuthorityAuthenticated } from "./auth/authority";
import { isFamilyAuthenticated } from "./auth/family";

function ProtectedAuthorityDashboard() {
  return isAuthorityAuthenticated()
    ? <AuthorityDashboard />
    : <Navigate to="/authority-login" replace />;
}

function ProtectedFamilyDashboard() {
  return isFamilyAuthenticated()
    ? <FamilyDashboard />
    : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/report" element={<FamilyReport />} />
        <Route path="/search" element={<Search />} />
        <Route path="/login" element={<LoginSelection />} />
        <Route path="/family-login" element={<LoginSelection defaultView="family-login" />} />
        <Route path="/family" element={<ProtectedFamilyDashboard />} />
        <Route path="/authority-login" element={<AuthorityLogin />} />
        <Route path="/authority-register" element={<AuthorityRegister />} />
        <Route path="/authority" element={<ProtectedAuthorityDashboard />} />
        <Route path="/responder" element={<ResponderRegister />} />
        <Route path="/case/:caseId" element={<CaseDetails />} />
        <Route path="/review/:caseId" element={<MatchReview />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
