import { Link, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const LINKS = [
  { href: '/admin/payments', label: 'Платежи и пользователи', icon: 'CreditCard' },
  { href: '/admin/feedback', label: 'Обращения', icon: 'MessageSquare' },
  { href: '/admin/reviews', label: 'Отзывы', icon: 'Star' },
];

const AdminNav = () => {
  const location = useLocation();

  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          to={l.href}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            location.pathname === l.href
              ? 'bg-hand text-primary-foreground'
              : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Icon name={l.icon} size={15} />
          {l.label}
        </Link>
      ))}
    </div>
  );
};

export default AdminNav;
