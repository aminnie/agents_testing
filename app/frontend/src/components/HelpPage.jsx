import { useEffect, useState } from "react";

export default function HelpPage({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [helpData, setHelpData] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError("");

    fetch("/api/help")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("HELP_LOAD_FAILED");
        }
        return response.json();
      })
      .then((payload) => setHelpData(payload))
      .catch(() => setError("Unable to load help information right now."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="card" data-cy="help-page-loading">
        <h2 data-cy="help-page-title">Help</h2>
        <p>Loading...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card" data-cy="help-page-error">
        <h2 data-cy="help-page-title">Help</h2>
        <p>{error}</p>
        {onBack ? (
          <button data-cy="help-back" onClick={onBack} type="button">
            Back
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section className="card" data-cy="help-page">
      <h2 data-cy="help-page-title">Help</h2>

      <h3>Demo users</h3>
      <ul data-cy="help-demo-users">
        {(helpData?.demoUsers || []).map((user) => (
          <li key={user.email}>
            <strong>{user.email}</strong> / {user.password} ({user.role})
          </li>
        ))}
      </ul>

      <h3>Navigation tips</h3>
      <ul data-cy="help-navigation-tips">
        {(helpData?.navigationTips || []).map((tip, index) => (
          <li key={`${tip}-${index}`}>{tip}</li>
        ))}
      </ul>

      {onBack ? (
        <button data-cy="help-back" onClick={onBack} type="button">
          Back
        </button>
      ) : null}
    </section>
  );
}
