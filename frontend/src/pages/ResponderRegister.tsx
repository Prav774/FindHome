import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ResponderRegister() {
  const navigate = useNavigate();
  return (
    <main className="report-page">
      <div className="report-container">
        <button className="back-button" onClick={() => navigate("/")}><ArrowLeft size={18} /> Back to Home</button>
        <section className="state-card responder-unavailable">
          <div className="report-icon"><ShieldCheck size={26} /></div>
          <div>
            <h1>Person registration is unavailable</h1>
            <p>The backend request contract for found-person submissions has not been confirmed. No information has been submitted.</p>
            <p>Responders can still search for an existing case, review its evidence and timeline, and submit a match decision.</p>
            <button className="primary-button" onClick={() => navigate("/search")}>Search a case</button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ResponderRegister;
