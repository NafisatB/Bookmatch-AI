import React, { useReducer, useEffect, useCallback } from "react";
import "./App.css";
import SelectField from "./component/Select";
import listOfGenreOption from "./store/genre.json";
import listOfMoodOption from "./store/mood.json";

const initialState = {
  genre: "",
  mood: "",
  level: "",
  aiResponses: [],
  isLoading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_GENRE":
      return { ...state, genre: action.payload, mood: "" };

    case "SET_MOOD":
      return { ...state, mood: action.payload };

    case "SET_LEVEL":
      return { ...state, level: action.payload };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "ADD_RESPONSE":
      return { ...state, aiResponses: [...state.aiResponses, action.payload] };

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // reset mood when genre changes
  useEffect(() => {
    if (state.genre) {
      dispatch({ type: "SET_MOOD", payload: "" });
    }
  }, [state.genre]);

  const fetchRecommendations = useCallback(async () => {
    if (!state.genre || !state.mood || !state.level) {
      dispatch({ type: "SET_ERROR", payload: "Fill all fields" });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genre: state.genre,
          mood: state.mood,
          level: state.level,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      console.log("API RESPONSE:", data);

      if (data?.candidates?.length > 0) {
        const candidate = data.candidates[0];

        // Extract text safely
        const text =
          candidate?.content?.[0]?.parts?.[0]?.text ||
          candidate?.output ||
          candidate?.text ||
          "No recommendation available";

        dispatch({ type: "ADD_RESPONSE", payload: text });
      } else {
        dispatch({
          type: "SET_ERROR",
          payload: "No recommendation available",
        });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.genre, state.mood, state.level]);

  return (
    <div className="app">
      <div className="card">
        <div className="header">
          <h1>BookMatch AI</h1>
          <p>Get AI-based book recommendations</p>
        </div>

        <section className="field">
          <SelectField
            placeholder="Please select a genre"
            id="genre"
            options={listOfGenreOption}
            onSelect={(val) => dispatch({ type: "SET_GENRE", payload: val })}
            value={state.genre}
          />

          <SelectField
            placeholder="Please select a mood"
            id="mood"
            options={listOfMoodOption[state.genre] || []}
            onSelect={(val) => dispatch({ type: "SET_MOOD", payload: val })}
            value={state.mood}
          />

          <SelectField
            placeholder="Please select a level"
            id="level"
            options={["Beginner", "Intermediate", "Expert"]}
            onSelect={(val) => dispatch({ type: "SET_LEVEL", payload: val })}
            value={state.level}
          />

          <button onClick={fetchRecommendations} disabled={state.isLoading}>
            {state.isLoading ? "Loading..." : "Get Recommendation"}
          </button>

          {state.error && <p className="error">{state.error}</p>}

          {state.aiResponses.map((recommend, index) => (
            <details key={index}>
              <summary>Recommendation {index + 1}</summary>
              <p>{recommend}</p>
            </details>
          ))}
        </section>
      </div>
    </div>
  );
}
