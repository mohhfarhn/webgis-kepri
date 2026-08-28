import { cookies } from 'next/headers';
import HomeClient from '../components/HomeClient';

type ThemeValue = 'light' | 'dark' | 'satellite';

export default async function Page() {
  const cookieStore = await cookies();
  const t = cookieStore.get('theme')?.value;
  const initialTheme: ThemeValue | null =
    t === 'light' || t === 'dark' || t === 'satellite' ? t : null;

  return <HomeClient initialTheme={initialTheme} />;
}
