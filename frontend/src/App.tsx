import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import FamilyReport from "./pages/FamilyReport";
import Search from "./pages/Search";
import AuthorityDashboard from "./pages/AuthorityDashboard";
import ResponderRegister from "./pages/ResponderRegister";
import MatchReview from "./pages/MatchReview";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/report" element={<FamilyReport />} />
        <Route path="/search" element={<Search />} />
        <Route path="/authority" element={<AuthorityDashboard />} />
        <Route path="/responder" element={<ResponderRegister />} />
        <Route path="/review/:caseId" element={<MatchReview />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;