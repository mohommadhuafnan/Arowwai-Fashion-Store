import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  theme: 'dark' | 'light';
  liveActivity: { type: string; message: string; timestamp: string }[];
}

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  theme: 'dark',
  liveActivity: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => { state.sidebarCollapsed = action.payload; },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => { state.mobileMenuOpen = action.payload; },
    toggleMobileMenu: (state) => { state.mobileMenuOpen = !state.mobileMenuOpen; },
    addLiveActivity: (state, action: PayloadAction<{ type: string; message: string }>) => {
      state.liveActivity.unshift({ ...action.payload, timestamp: new Date().toISOString() });
      if (state.liveActivity.length > 20) state.liveActivity.pop();
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, setMobileMenuOpen, toggleMobileMenu, addLiveActivity } = uiSlice.actions;
export default uiSlice.reducer;
