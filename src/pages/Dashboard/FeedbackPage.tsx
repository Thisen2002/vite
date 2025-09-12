import React from "react";
import FeedbackWidget from "../../components/OrganizerDashBoard/FeedbackWidget"; // adjust path if needed

const FeedbackPage: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Feedback</h2>
      <FeedbackWidget />
    </div>
  );
};

export default FeedbackPage;
