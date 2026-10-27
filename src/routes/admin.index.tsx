import { createFileRoute } from '@tanstack/react-router';
import AdminHome from '@/pages/AdminHome';

export const Route = createFileRoute('/admin/')({
  component: AdminHome,
});
