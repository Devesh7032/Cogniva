export interface RawHackathon {
  external_id: string;
  source: 'UNSTOP' | 'DEVFOLIO' | 'DEVPOST';
  title: string;
  description: string;
  official_url: string;
  image_url?: string;
  status: 'LIVE' | 'UPCOMING' | 'ENDING_SOON' | 'ENDED';
  mode: 'Online' | 'Offline' | 'Hybrid';
  start_date?: string;
  end_date?: string;
  registration_deadline?: string;
  eligibility?: string;
  team_size?: string;
  categories: string[];
  skills: string[];
  participant_count?: number;
  prize?: string;
  organizer?: string;
  source_created_at?: string;
}

export interface HackathonProvider {
  name: 'UNSTOP' | 'DEVFOLIO' | 'DEVPOST';
  fetchHackathons(): Promise<RawHackathon[]>;
}

function cleanHtml(str?: string): string {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
}

export function isValidUrl(urlStr?: string, expectedDomain?: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const u = new URL(urlStr);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (expectedDomain && !u.hostname.toLowerCase().includes(expectedDomain.toLowerCase())) return false;
    return true;
  } catch {
    return false;
  }
}

// ----------------------------------------------------
// 1. DEVFOLIO PROVIDER
// ----------------------------------------------------
export class DevfolioProvider implements HackathonProvider {
  name = 'DEVFOLIO' as const;

  async fetchHackathons(): Promise<RawHackathon[]> {
    try {
      const response = await fetch('https://devfolio.co/hackathons', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        console.warn(`[DevfolioProvider] Source returned HTTP status ${response.status}`);
        return [];
      }

      const html = await response.text();
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
      if (!nextDataMatch) {
        console.warn('[DevfolioProvider] Unable to parse Devfolio payload structure');
        return [];
      }

      const nextData = JSON.parse(nextDataMatch[1]);
      const queries = nextData?.props?.pageProps?.dehydratedState?.queries || [];
      let rawItems: any[] = [];
      for (const q of queries) {
        if (q?.state?.data?.open_hackathons) rawItems.push(...q.state.data.open_hackathons);
        if (q?.state?.data?.upcoming_hackathons) rawItems.push(...q.state.data.upcoming_hackathons);
      }

      const verifiedEvents: RawHackathon[] = [];
      for (const item of rawItems) {
        const slug = item.slug;
        const official_url = item.settings?.site || (slug ? `https://${slug}.devfolio.co` : '');

        if (!isValidUrl(official_url, 'devfolio.co')) continue;
        if (!item.name || !String(item.name).trim()) continue;

        const regEnd = item.settings?.reg_ends_at || item.ends_at;
        let status: RawHackathon['status'] = item.is_live ? 'LIVE' : 'UPCOMING';
        if (regEnd) {
          const diffDays = (new Date(regEnd).getTime() - Date.now()) / (1000 * 3600 * 24);
          if (diffDays < 0) status = 'ENDED';
          else if (diffDays <= 4) status = 'ENDING_SOON';
        }

        if (status === 'ENDED') continue;

        const categories = (item.themes || []).map((t: any) => t.theme?.name).filter(Boolean);

        verifiedEvents.push({
          external_id: String(item.uuid || item.slug),
          source: 'DEVFOLIO',
          title: String(item.name).trim(),
          description: item.settings?.tagline || item.settings?.about || 'Official hackathon hosted on Devfolio.',
          official_url,
          image_url: item.featured_cover_img_v2 || item.featured_cover_img || item.logo || undefined,
          status,
          mode: item.is_online ? 'Online' : 'Offline',
          start_date: item.starts_at || undefined,
          end_date: item.ends_at || undefined,
          registration_deadline: regEnd || undefined,
          participant_count: typeof item.participants_count === 'number' ? item.participants_count : undefined,
          categories: categories.length > 0 ? categories : ['Open Innovation'],
          skills: categories.length > 0 ? categories : ['Software Engineering'],
          organizer: item.name || 'Devfolio Partner'
        });

        if (verifiedEvents.length >= 10) break;
      }

      console.log(`[DevfolioProvider] Successfully verified ${verifiedEvents.length} real events.`);
      return verifiedEvents;
    } catch (err) {
      console.warn('[DevfolioProvider] Live provider fetch exception:', err);
      return [];
    }
  }
}

// ----------------------------------------------------
// 2. UNSTOP PROVIDER
// ----------------------------------------------------
export class UnstopProvider implements HackathonProvider {
  name = 'UNSTOP' as const;

  async fetchHackathons(): Promise<RawHackathon[]> {
    try {
      const response = await fetch('https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&per_page=15', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`[UnstopProvider] Source returned HTTP status ${response.status}`);
        return [];
      }

      const data = await response.json();
      const rawItems = data?.data?.data || data?.opportunities || (Array.isArray(data) ? data : []);
      if (!Array.isArray(rawItems)) return [];

      const verifiedEvents: RawHackathon[] = [];
      for (const item of rawItems) {
        const official_url = item.seo_url || item.short_url || (item.slug ? `https://unstop.com/p/${item.slug}` : '');
        if (!isValidUrl(official_url, 'unstop.com')) continue;

        const title = item.title || item.heading;
        if (!title || !String(title).trim()) continue;

        const regEnd = item.regnRequirements?.end_regn_dt || item.end_date;
        let status: RawHackathon['status'] = item.regnRequirements?.reg_status === 'STARTED' ? 'LIVE' : 'UPCOMING';
        if (regEnd) {
          const diffDays = (new Date(regEnd).getTime() - Date.now()) / (1000 * 3600 * 24);
          if (diffDays < 0) status = 'ENDED';
          else if (diffDays <= 4) status = 'ENDING_SOON';
        }

        if (status === 'ENDED') continue;

        const minTeam = item.regnRequirements?.min_team_size;
        const maxTeam = item.regnRequirements?.max_team_size;
        const team_size = minTeam ? `${minTeam} - ${maxTeam} members` : undefined;

        const skills = Array.from(new Set((item.required_skills || []).map((s: any) => s.skill || s.skill_name).filter(Boolean))) as string[];
        const categories = Array.from(new Set((item.workfunction || []).map((w: any) => w.name).filter(Boolean))) as string[];

        verifiedEvents.push({
          external_id: String(item.id || item.opportunity_id),
          source: 'UNSTOP',
          title: String(title).trim(),
          description: item.short_description || item.sub_heading || 'National level engineering hackathon hosted on Unstop.',
          official_url,
          image_url: item.banner_mobile?.image_url || item.banner_desktop?.image_url || item.logoUrl2 || undefined,
          status,
          mode: item.region === 'Online' || item.regnRequirements?.work_location_type === 'online' ? 'Online' : 'Offline',
          start_date: item.start_date || undefined,
          end_date: item.end_date || undefined,
          registration_deadline: regEnd || undefined,
          team_size,
          participant_count: item.registerCount || item.viewsCount || undefined,
          categories: categories.length > 0 ? categories : ['Engineering'],
          skills: skills.length > 0 ? skills : ['Coding'],
          organizer: item.organisation?.name || 'Unstop Campus'
        });

        if (verifiedEvents.length >= 10) break;
      }

      console.log(`[UnstopProvider] Successfully verified ${verifiedEvents.length} real events.`);
      return verifiedEvents;
    } catch (err) {
      console.warn('[UnstopProvider] Live provider fetch exception:', err);
      return [];
    }
  }
}

// ----------------------------------------------------
// 3. DEVPOST PROVIDER
// ----------------------------------------------------
export class DevpostProvider implements HackathonProvider {
  name = 'DEVPOST' as const;

  async fetchHackathons(): Promise<RawHackathon[]> {
    try {
      const response = await fetch('https://devpost.com/api/hackathons', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`[DevpostProvider] Source returned HTTP status ${response.status}`);
        return [];
      }

      const data = await response.json();
      const rawItems = data?.hackathons;
      if (!Array.isArray(rawItems)) return [];

      const verifiedEvents: RawHackathon[] = [];
      for (const item of rawItems) {
        const official_url = item.url;
        if (!isValidUrl(official_url, 'devpost.com')) continue;
        if (!item.title || !String(item.title).trim()) continue;

        let status: RawHackathon['status'] = item.open_state === 'open' ? 'LIVE' : 'UPCOMING';
        if (item.open_state === 'ended' || item.open_state === 'closed') status = 'ENDED';
        if (status === 'ENDED') continue;

        let image_url = item.thumbnail_url;
        if (image_url && image_url.startsWith('//')) {
          image_url = 'https:' + image_url;
        }

        const categories = (item.themes || []).map((t: any) => t.name).filter(Boolean);
        const prize = cleanHtml(item.prize_amount);

        verifiedEvents.push({
          external_id: String(item.id),
          source: 'DEVPOST',
          title: String(item.title).trim(),
          description: item.analytics_identifier ? `${item.analytics_identifier} - ${item.time_left_to_submission || 'Global online hackathon on Devpost.'}` : 'Global online hackathon on Devpost.',
          official_url,
          image_url: image_url || undefined,
          status,
          mode: item.displayed_location?.location?.toLowerCase().includes('online') ? 'Online' : 'Offline',
          registration_deadline: item.submission_period_dates || undefined,
          prize: prize || undefined,
          participant_count: item.registrations_count || undefined,
          categories: categories.length > 0 ? categories : ['Software'],
          skills: categories.length > 0 ? categories : ['Software Development'],
          organizer: item.organization_name || 'Devpost Partner'
        });

        if (verifiedEvents.length >= 10) break;
      }

      console.log(`[DevpostProvider] Successfully verified ${verifiedEvents.length} real events.`);
      return verifiedEvents;
    } catch (err) {
      console.warn('[DevpostProvider] Live provider fetch exception:', err);
      return [];
    }
  }
}

// Master Fetcher registry
export class HackathonAggregator {
  private providers: HackathonProvider[] = [
    new UnstopProvider(),
    new DevfolioProvider(),
    new DevpostProvider()
  ];

  async fetchAll(): Promise<RawHackathon[]> {
    const results: RawHackathon[] = [];

    for (const provider of this.providers) {
      try {
        const items = await provider.fetchHackathons();
        results.push(...items);
      } catch (err) {
        console.error(`Error fetching from provider ${provider.name}:`, err);
      }
    }

    return results;
  }
}
