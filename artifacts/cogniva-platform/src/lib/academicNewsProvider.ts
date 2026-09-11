export interface AcademicNewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
  published_at: string;
  category: 'AI_ML' | 'SOFTWARE_ENG' | 'CLOUD_DEVOPS' | 'CYBERSECURITY' | 'HACKATHONS' | 'RESEARCH';
  importance: 'HIGH_VALUE' | 'NORMAL';
  learning_path_relevance: string;
}

const RELEVANT_KEYWORDS = [
  'ai', 'artificial intelligence', 'machine learning', 'deep learning', 'llm', 'gpt', 'gemini', 'claude',
  'python', 'javascript', 'typescript', 'react', 'node', 'rust', 'golang', 'cloud', 'aws', 'docker', 'kubernetes',
  'cybersecurity', 'security', 'vulnerability', 'open source', 'developer', 'framework', 'algorithm', 'software',
  'hackathon', 'internship', 'scholarship', 'arxiv', 'research', 'model', 'quantum', 'database'
];

const REJECT_KEYWORDS = [
  'celebrity', 'gossip', 'sports', 'nba', 'nfl', 'movie', 'actor', 'actress', 'hollywood',
  'politics', 'election', 'fashion', 'entertainment', 'dating', 'royal family'
];

const HIGH_VALUE_INDICATORS = [
  'launch', 'release', 'announces', 'breakthrough', 'major update', 'v2', 'v3', 'v4', 'v5',
  'critical', 'zero-day', 'vulnerability', 'scholarship', 'internship', 'hackathon', 'foundation',
  'open-source', 'benchmark', 'gpt-5', 'gemini 2', 'claude 3.7', 'llama', 'deepseek'
];

export async function fetchLiveAcademicNews(): Promise<AcademicNewsItem[]> {
  const newsItems: AcademicNewsItem[] = [];

  // Source 1: Dev.to AI & Tech Articles
  try {
    const res = await fetch('https://dev.to/api/articles?tag=ai&per_page=15');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const item of data) {
          const title = item.title || '';
          const desc = item.description || title;
          const url = item.url || item.canonical_url;
          if (!url || isIrrelevant(title, desc)) continue;

          const isHighValue = checkHighValue(title, desc);
          newsItems.push({
            id: `devto_${item.id}`,
            title: title.trim(),
            description: desc.trim(),
            source: `Dev.to • ${item.user?.name || 'Developer Community'}`,
            url: url.trim(),
            published_at: item.published_at || new Date().toISOString(),
            category: title.toLowerCase().includes('security') ? 'CYBERSECURITY' : 'AI_ML',
            importance: isHighValue ? 'HIGH_VALUE' : 'NORMAL',
            learning_path_relevance: 'Directly applicable to your CS & Machine Learning path.'
          });
        }
      }
    }
  } catch (err) {
    console.warn('[AcademicNews] Dev.to fetch notice:', err);
  }

  // Source 2: Hacker News Top Tech Stories
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (res.ok) {
      const storyIds: number[] = await res.json();
      const top10 = storyIds.slice(0, 15);
      
      const storyPromises = top10.map(async (id) => {
        try {
          const sRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
          if (sRes.ok) return await sRes.json();
        } catch {
          return null;
        }
      });

      const stories = await Promise.all(storyPromises);
      for (const s of stories) {
        if (!s || !s.title || !s.url) continue;
        if (isIrrelevant(s.title, '')) continue;
        if (!isRelevantToStudents(s.title)) continue;

        const isHighValue = checkHighValue(s.title, '');
        newsItems.push({
          id: `hn_${s.id}`,
          title: s.title.trim(),
          description: `Discussion on Hacker News (${s.score || 0} points, ${s.descendants || 0} comments).`,
          source: 'Hacker News • Tech Intelligence',
          url: s.url.trim(),
          published_at: new Date((s.time || Date.now() / 1000) * 1000).toISOString(),
          category: s.title.toLowerCase().includes('cloud') ? 'CLOUD_DEVOPS' : 'SOFTWARE_ENG',
          importance: isHighValue ? 'HIGH_VALUE' : 'NORMAL',
          learning_path_relevance: 'Relevant to current software engineering and tech trends.'
        });
      }
    }
  } catch (err) {
    console.warn('[AcademicNews] HackerNews fetch notice:', err);
  }

  // Deduplicate by title similarity or ID
  const uniqueMap = new Map<string, AcademicNewsItem>();
  for (const item of newsItems) {
    const cleanKey = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!uniqueMap.has(cleanKey)) {
      uniqueMap.set(cleanKey, item);
    }
  }

  const finalItems = Array.from(uniqueMap.values());

  // Sort: HIGH_VALUE first, then newest timestamp
  finalItems.sort((a, b) => {
    if (a.importance !== b.importance) {
      return a.importance === 'HIGH_VALUE' ? -1 : 1;
    }
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });

  return finalItems;
}

function isIrrelevant(title: string, desc: string): boolean {
  const combined = (title + ' ' + desc).toLowerCase();
  return REJECT_KEYWORDS.some(kw => combined.includes(kw));
}

function isRelevantToStudents(title: string): boolean {
  const t = title.toLowerCase();
  return RELEVANT_KEYWORDS.some(kw => t.includes(kw));
}

function checkHighValue(title: string, desc: string): boolean {
  const combined = (title + ' ' + desc).toLowerCase();
  return HIGH_VALUE_INDICATORS.some(ind => combined.includes(ind));
}
