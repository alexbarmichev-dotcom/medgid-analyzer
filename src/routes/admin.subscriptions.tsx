import { createFileRoute } from '@tanstack/react-router';
import AdminSubscriptions from '@/pages/AdminSubscriptions';

export const Route = createFileRoute('/admin/subscriptions')({
  component: AdminSubscriptions,
});
