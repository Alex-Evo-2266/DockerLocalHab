import { useEffect, useState } from 'react';

type CatalogResponse = { repositories: string[] };
type TagsResponse = { name: string; tags: string[] };
type RepoTag = { repository: string; tag: string };

export default function Home() {
  const [repoTags, setRepoTags] = useState<RepoTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catalogRes = await fetch('/api/catalog');
        const catalogData: CatalogResponse & { error?: string } = await catalogRes.json();
        if (!catalogData.repositories) { setError(catalogData.error || 'Unknown error'); return; }

        const allRepoTags: RepoTag[] = [];
        for (const repo of catalogData.repositories) {
          try {
            const tagsRes = await fetch(`/api/tags/${repo}`);
            const tagsData: TagsResponse & { error?: string } = await tagsRes.json();
            if (tagsData.tags) {
              tagsData.tags.forEach(tag => allRepoTags.push({ repository: repo, tag }));
            }
          } catch (err) { console.error(err); }
        }
        setRepoTags(allRepoTags);
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filteredRepoTags = repoTags.filter(rt =>
    rt.repository.toLowerCase().includes(search.toLowerCase()) ||
    rt.tag.toLowerCase().includes(search.toLowerCase())
  );

  const syncFromHub = async (repo: string, tag: string) => {
    setSyncing(prev => ({ ...prev, [`${repo}:${tag}`]: true }));
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository: repo, tag }),
      });
      const data = await res.json();
      if (!data.success) alert(`Error: ${data.message}`);
    } catch (err) {
      alert(`Error: ${err}`);
    } finally {
      setSyncing(prev => ({ ...prev, [`${repo}:${tag}`]: false }));
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Docker Registry Repositories</h1>
      <input
        type="text"
        placeholder="Search repository or tag..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: '1rem', padding: '0.5rem', width: '300px' }}
      />

      <table border={1} cellPadding={5} cellSpacing={0}>
        <thead>
          <tr>
            <th>Repository</th>
            <th>Tag</th>
            <th>Download</th>
            <th>Sync Hub → Registry</th>
          </tr>
        </thead>
        <tbody>
          {filteredRepoTags.map((rt, idx) => (
            <tr key={`${rt.repository}-${rt.tag}-${idx}`}>
              <td>{rt.repository}</td>
              <td>{rt.tag}</td>
              <td>
                <button
                  onClick={() => navigator.clipboard.writeText(`docker pull ${process.env.NEXT_PUBLIC_REGISTRY_URL || '192.168.1.132:5005'}/${rt.repository}:${rt.tag}`)}
                >
                  Copy Pull
                </button>
              </td>
              <td>
                <button
                  onClick={() => syncFromHub(rt.repository, rt.tag)}
                  disabled={syncing[`${rt.repository}:${rt.tag}`]}
                >
                  {syncing[`${rt.repository}:${rt.tag}`] ? 'Syncing...' : 'Sync'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredRepoTags.length === 0 && <p>No results found</p>}
    </div>
  );
}
