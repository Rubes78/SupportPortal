"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface FeedbackWidgetProps {
  articleId: string;
}

export function FeedbackWidget({ articleId }: FeedbackWidgetProps) {
  const [helpful, setHelpful] = useState(0);
  const [notHelpful, setNotHelpful] = useState(0);
  const [userVoted, setUserVoted] = useState<boolean | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    fetch(`/api/feedback?articleId=${articleId}`)
      .then((r) => r.json())
      .then((d) => {
        setHelpful(d.helpful);
        setNotHelpful(d.notHelpful);
        setUserVoted(d.userVoted);
      });
  }, [articleId]);

  const vote = async (isHelpful: boolean) => {
    setIsVoting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, isHelpful }),
      });
      const data = await res.json();
      setHelpful(data.helpful);
      setNotHelpful(data.notHelpful);
      setUserVoted(data.userVoted);
      toast.success("Thanks for your feedback!");
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-sm font-medium text-gray-700 text-center mb-3">
        Was this article helpful?
      </p>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => vote(true)}
          disabled={isVoting}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            userVoted === true
              ? "bg-green-600 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400"
          }`}
        >
          👍 Yes ({helpful})
        </button>
        <button
          onClick={() => vote(false)}
          disabled={isVoting}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            userVoted === false
              ? "bg-red-600 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-400"
          }`}
        >
          👎 No ({notHelpful})
        </button>
      </div>
    </div>
  );
}
