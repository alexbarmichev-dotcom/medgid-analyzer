import { createFileRoute } from '@tanstack/react-router';
import AdminPayments from '@/pages/AdminPayments';

export const Route = createFileRoute('/admin/payments')({
  component: AdminPayments,
});
