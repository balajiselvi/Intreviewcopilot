import { createSlice } from '@reduxjs/toolkit';

const historySlice = createSlice({
  name: 'history',
  initialState: [],
  reducers: {
    addToHistory: (state, action) => {
      state.push(action.payload);
    },
    clearHistory: () => [],
    updateLatestQuestion: (state, action) => {
      const { utteranceId, text, status } = action.payload || {};
      if (!utteranceId) return;
      for (let i = state.length - 1; i >= 0; i -= 1) {
        if (state[i].type === "question" && state[i].utteranceId === utteranceId) {
          if (typeof text === "string") state[i].text = text;
          if (status) state[i].status = status;
          return;
        }
      }
    },
  },
});

export const { addToHistory, clearHistory, updateLatestQuestion } = historySlice.actions;
export default historySlice.reducer;
