import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const DashboardLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
