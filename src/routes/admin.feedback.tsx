import { createFileRoute } from '@tanstack/react-router';
import AdminFeedback from '@/pages/AdminFeedback';

export const Route = createFileRoute('/admin/feedback')({
  component: AdminFeedback,
});
