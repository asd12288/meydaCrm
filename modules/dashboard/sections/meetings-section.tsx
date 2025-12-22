import { getTodaysMeetings, getUpcomingMeetings } from '@/modules/meetings/lib/actions';
import { MeetingsWidget } from '../components/meetings-widget';

export async function SalesMeetingsSection() {
  const [todayMeetings, upcomingMeetings] = await Promise.all([
    getTodaysMeetings(),
    getUpcomingMeetings(5),
  ]);

  return (
    <MeetingsWidget
      todayMeetings={todayMeetings}
      upcomingMeetings={upcomingMeetings}
    />
  );
}
