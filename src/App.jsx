import React, { useReducer, useEffect, useCallback } from "react";
import './App.css'
import SelectField from "./component/Select";
import listOfGenreOption from "./store/genre.json";
import listOfMoodOption from "./store/mood.json";

const initialState = {
  genre: "",
  mood: "",
  level: "",
  aiResponses: [],
  isLoading: false,
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

    case "ADD_RESPONSE":
      return { ...state, aiResponses: [...state.aiResponses, action.payload] };

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // update mood list when genre changes
  useEffect(() => {
    if (state.genre) dispatch({ type: "SET_MOOD", payload: "" });
  }, [state.genre]);

  const fetchRecommendations = useCallback(async () => {
    if (!state.genre || !state.mood || !state.level) return;

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const GEMINI_API_KEY = "AIzaSyDC6-1zWGJy_VAW-1JQaSTXiACdLtlgy1g";

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Recommend 6 books for a ${state.level} ${state.genre} reader feeling ${state.mood}. Explain why.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (data?.candidates?.length > 0) {
        dispatch({ type: "ADD_RESPONSE", payload: data.candidates[0] });
      }
    } catch (err) {
      console.log(err);
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

      {state.aiResponses.map((recommend, index) => (
        <details key={index}>
          <summary>Recommendation {index + 1}</summary>
          <p>
            {recommend?.content?.[0]?.parts?.[0]?.text ||
              "No recommendation available"}
          </p>
        </details>
      ))}
    </section>
  
    </div>
  </div>
  );
}