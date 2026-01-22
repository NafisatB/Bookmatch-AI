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
  function handleSelect(id, value) {
    dispatch({
      type:
        id === "genre"
          ? "SET_GENRE"
          : id === "mood"
            ? "SET_MOOD"
            : id === "level"
              ? "SET_LEVEL"
              : null,
      payload: value,
    })
  }


  // update mood list when genre changes
  useEffect(() => {
    dispatch({ type: "SET_MOOD", payload: "" });
  }, [state.genre]);

  const fetchRecommendations = useCallback(async () => {
    if (!state.genre || !state.mood || !state.level)
      return
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "x-goog-api-key": GEMINI_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Recommend 6 books for a ${state.level} ${state.genre} reader feeling ${state.mood}. Explain why.` }] }]
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Request failed");
      }

      const data = await res.json();

      const newRecommendation = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (newRecommendation) {
        dispatch({
          type: "ADD_RESPONSE",
          payload: newRecommendation
        })
      }

    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch recommendation" });
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
            onSelect={(val) => handleSelect("genre", val)}
            value={state.genre}
          />

          <SelectField
            placeholder="Please select a mood"
            id="mood"
            options={listOfMoodOption[state.genre] || []}
            onSelect={(val) => handleSelect("mood", val)}
            value={state.mood}
          />

          <SelectField
            placeholder="Please select a level"
            id="level"
            options={["Beginner", "Intermediate", "Expert"]}
            onSelect={(val) => handleSelect("level", val)}
            value={state.level}
          />

          <button onClick={fetchRecommendations} disabled={state.isLoading}>
            {state.isLoading ? "Loading..." : "Get Recommendation"}
          </button>



          {state.aiResponses.map((recommend, index) => (
            <details key={index} name="recommendation">
              <summary>Recommendation {index + 1}</summary>
              <p>{recommend}</p>
            </details>

          ))}

          {state.error && (
            <p className="error">{state.error}</p>
          )}
        </section>
      </div>
    </div>
  );
}
