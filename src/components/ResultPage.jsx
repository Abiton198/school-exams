import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResultsPage() {
  const [result, setResult] = useState(null);
  const [timePassed, setTimePassed] = useState(false);
  const navigate = useNavigate();

  // Load result from localStorage on mount
  useEffect(() => {
    const savedResult = localStorage.getItem('examResult');
    if (savedResult) {
      const parsed = JSON.parse(savedResult);
      setResult(parsed);

      const completedTime = new Date(parsed.completedTime || parsed.time || new Date());
      const now = new Date();
      const diff = now - completedTime;

      if (diff >= 48 * 60 * 60 * 1000) {
        setTimePassed(true); // 48hr passed
      }
    }
  }, []);

  if (!result) {
    return (
      <div className="text-center mt-10 text-xl">
        No result found. Please complete the exam first.
      </div>
    );
  }

  // Detect if exam has written parts awaiting teacher marking
  const hasUnmarkedWritten = result.answers?.some(
    (a) => a.type === 'written' && (a.teacherMark === null || a.teacherMark === undefined)
  );

  const autoScoreOnly = result.answers?.filter(a => a.type === 'mcq' && a.answer === a.correctAnswer).length || 0;
  const totalAutoPossible = result.answers?.filter(a => a.type === 'mcq').length || 0;

  // Final score: only display percentage if no written answers or all are marked
  const isFullyMarked = !hasUnmarkedWritten;
  const finalScore = isFullyMarked ? result.score : autoScoreOnly;
  const finalPercentage = isFullyMarked && result.percentage !== undefined
    ? `${parseFloat(result.percentage).toFixed(2)}%`
    : 'Pending...';

  const bgColor = isFullyMarked
    ? (parseFloat(result.percentage) >= 50 ? 'bg-green-100' : 'bg-red-100')
    : 'bg-yellow-100';

  // Feedback messages
  const renderFeedback = () => {
    if (!isFullyMarked) {
      return (
        <div className="text-yellow-600 mt-4">
          <p>⏳ Your exam includes written questions and is awaiting teacher marking.</p>
          <p>Please check back soon to view your final score. Thank you for your patience!</p>
        </div>
      );
    }

    const percentage = parseFloat(result.percentage);
    if (percentage < 50) {
      return (
        <div className="text-red-500 mt-4">
          <p>Oh no 😞 It looks like you're struggling. Don't give up — you’ll improve!</p>
          <p>💡 Tip: “Success is the sum of small efforts repeated daily.”</p>
        </div>
      );
    }

    return (
      <div className="text-green-600 mt-4">
        <p>🎉 Great job! You've done well — keep up the hard work!</p>
        <p>You're on the right track 🚀</p>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 rounded shadow bg-white">
      <h2 className="text-2xl font-bold text-center mb-6">📋 Exam Results</h2>

      <div className={`p-4 rounded ${bgColor}`}>
        <p><strong>Name:</strong> {result.name}</p>
        <p><strong>Score:</strong> {finalScore} / {isFullyMarked ? result.answers.length : totalAutoPossible}</p>
        <p><strong>Percentage:</strong> {finalPercentage}</p>
        <p><strong>Unanswered Questions:</strong> {result.unanswered ?? 'N/A'}</p>
        <p><strong>Completed On:</strong> {new Date(result.completedTime || result.time).toLocaleString()}</p>
      </div>

      {renderFeedback()}

      {/* Retake message */}
      <div className="flex flex-col space-y-4 mt-8">
        {timePassed ? (
          <button
            onClick={() => {
              localStorage.removeItem('examResult');
              localStorage.removeItem('examAnswers');
              navigate('/');
            }}
            className="bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition"
          >
            🔁 Retake Exam
          </button>
        ) : (
          <p className="text-center text-gray-500">⏱ You can retake the exam after 48 hours</p>
        )}
      </div>
    </div>
  );
}
