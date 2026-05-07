import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "./utils/axiosClient";


const saveToken  = (token) => localStorage.setItem("token", token);
const clearToken = ()      => localStorage.removeItem("token");



export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post("/user/register", userData);
      
      if (data.token) saveToken(data.token);
      return data; 
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post("/user/login", credentials);
      
      if (data.token) saveToken(data.token);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);

export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get("/user/check");
      
      return data.user ?? data;
    } catch (error) {
      clearToken(); 
      return rejectWithValue(
        error.response?.data?.message || "Not authenticated"
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await axiosClient.post("/user/logout");
    } catch (error) {
      
      console.warn("Logout API failed, clearing local session anyway.");
    } finally {
      clearToken(); 
    }
    return null;
  }
);



const initialState = {
  user:            null,
  token:           localStorage.getItem("token") || null,
  isAuthenticated: false,
  loading:         true,  
  error:           null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    
    clearAuth: (state) => {
      state.user            = null;
      state.token           = null;
      state.isAuthenticated = false;
      clearToken();
    },
  },

  extraReducers: (builder) => {
    builder

      
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading         = false;
        state.user            = action.payload.user  ?? action.payload;
        state.token           = action.payload.token ?? null;
        state.isAuthenticated = !!action.payload.user;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading         = false;
        state.error           = action.payload;
        state.user            = null;
        state.isAuthenticated = false;
      })

      
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading         = false;
        state.user            = action.payload.user;
        state.token           = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading         = false;
        state.error           = action.payload;
        state.user            = null;
        state.isAuthenticated = false;
      })

      
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading         = false;
        state.user            = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading         = false;
        state.user            = null;
        state.token           = null;       
        state.isAuthenticated = false;
      })

      
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading         = false;
        state.user            = null;
        state.token           = null;
        state.isAuthenticated = false;
        state.error           = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        
        state.loading         = false;
        state.user            = null;
        state.token           = null;
        state.isAuthenticated = false;
        state.error           = action.payload;
      });
  },
});

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;