import { Outlet } from 'react-router';
import './App.css';

export function App() {
  return (
    <div className="app">
      <Outlet />
    </div>
  );
}
