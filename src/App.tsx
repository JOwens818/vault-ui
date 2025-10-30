import { Container } from '@chakra-ui/react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import RequireAuth from './auth/RequireAuth';
import CreateSecret from './pages/CreateSecret';
import EditSecret from './pages/EditSecret';

export default function App() {
  return (
    <>
      <Header />
      <Container py={10}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/secrets/new" element={<CreateSecret />} />
          <Route path="/secrets/:id/edit" element={<EditSecret />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Container>
    </>
  );
}
