import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeadActivityTabs } from '../components/lead-activity-tabs';
import { LeadHistory } from '../components/lead-history';
import {
  LeadDetailSkeleton,
  ProfileCardSkeleton,
  ActivityTabsSkeleton,
} from '../ui/lead-detail-skeleton';
import { ContactInfoItem } from '../ui/contact-info-item';
import { IconMail } from '@tabler/icons-react';

describe('LeadActivityTabs', () => {
  it('renders comments tab by default', () => {
    render(
      <LeadActivityTabs
        commentsContent={<div>Comments Content</div>}
        historyContent={<div>History Content</div>}
        commentCount={5}
        historyCount={10}
      />
    );

    expect(screen.getByText('Commentaires')).toBeInTheDocument();
    expect(screen.getByText('Historique')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Comments Content')).toBeInTheDocument();
  });

  it('switches to history tab when clicked', async () => {
    render(
      <LeadActivityTabs
        commentsContent={<div>Comments Content</div>}
        historyContent={<div>History Content</div>}
        commentCount={5}
        historyCount={10}
      />
    );

    // Click history tab using fireEvent
    const historyTab = screen.getByText('Historique').closest('button')!;
    fireEvent.click(historyTab);

    expect(screen.getByText('History Content')).toBeInTheDocument();
  });
});

describe('LeadHistory', () => {
  it('renders empty state when no history', () => {
    render(<LeadHistory history={[]} />);
    expect(screen.getByText('Aucun historique')).toBeInTheDocument();
  });

  it('renders history events', () => {
    const history = [
      {
        id: '1',
        lead_id: 'lead-1',
        actor_id: 'user-1',
        event_type: 'created' as const,
        before_data: null,
        after_data: null,
        metadata: null,
        created_at: new Date().toISOString(),
        actor: { id: 'user-1', display_name: 'John Doe', avatar: null },
      },
    ];

    render(<LeadHistory history={history} />);
    expect(screen.getByText('Créé')).toBeInTheDocument();
    expect(screen.getByText('par John Doe')).toBeInTheDocument();
  });

  it('shows "Système" when no actor', () => {
    const history = [
      {
        id: '1',
        lead_id: 'lead-1',
        actor_id: null,
        event_type: 'imported' as const,
        before_data: null,
        after_data: null,
        metadata: null,
        created_at: new Date().toISOString(),
        actor: null,
      },
    ];

    render(<LeadHistory history={history} />);
    expect(screen.getByText('par Système')).toBeInTheDocument();
  });
});

describe('ContactInfoItem', () => {
  it('renders nothing when value is null', () => {
    const { container } = render(
      <ContactInfoItem icon={IconMail} label="Email" value={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when value is undefined', () => {
    const { container } = render(
      <ContactInfoItem icon={IconMail} label="Email" value={undefined} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders label and value when provided', () => {
    render(
      <ContactInfoItem icon={IconMail} label="Email" value="test@example.com" />
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
});

describe('Lead Detail Skeletons', () => {
  it('LeadDetailSkeleton renders without crashing', () => {
    const { container } = render(<LeadDetailSkeleton />);
    expect(container.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('ProfileCardSkeleton renders skeleton elements', () => {
    const { container } = render(<ProfileCardSkeleton />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(5);
  });

  it('ActivityTabsSkeleton renders skeleton elements', () => {
    const { container } = render(<ActivityTabsSkeleton />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(5);
  });
});
